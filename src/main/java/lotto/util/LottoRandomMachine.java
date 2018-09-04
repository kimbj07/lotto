package lotto.util;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.math.RandomUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import lotto.model.AppearanceCount;
import lotto.model.GameInfoForDB;

public class LottoRandomMachine {
	@SuppressWarnings("unused")
	private static final Log log = LogFactory.getLog(LottoRandomMachine.class);

	// 로또 번호 셋
	private static final HashSet<Integer> NUMBERS = new HashSet<Integer>(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10 //
		, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30 //
		, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45));

	private static final int WIN_NUMBER_COUNT = 6;

	public static Set<Integer> recommendNumbers(List<GameInfoForDB> gameInfos, List<AppearanceCount> appearanceCounts) {
		// Set<Integer> excludeNumbers = getRandomNumberAWeekAgo(gameInfos);
		Set<Integer> excludeNumbers = null;
		return recommendNumbers(gameInfos, appearanceCounts, excludeNumbers, null);
	}

	public static Set<Integer> getRandomNumberAWeekAgo(List<GameInfoForDB> gameInfos) {
		GameInfoForDB aWeekAgoGameInfo = gameInfos.get(0);
		List<Integer> aWeeksAgoNumbers = aWeekAgoGameInfo.getNumbers();
		Collections.shuffle(aWeeksAgoNumbers);

		GameInfoForDB twoWeekAgoGameInfo = gameInfos.get(1);
		List<Integer> twoWeeksAgoNumbers = twoWeekAgoGameInfo.getNumbers();
		Collections.shuffle(twoWeeksAgoNumbers);

		Set<Integer> result = new HashSet<Integer>();
		result.addAll(aWeeksAgoNumbers.subList(0, 3));
		result.addAll(twoWeeksAgoNumbers.subList(0, 2));

		return result;
	}

	/**
	 * 로또 번호 추천
	 * 
	 * @param gameInfos - 최근 로또 정보(3회)
	 * @param appearanceCounts - 번호 등장 횟수로 정렬된 번호 목록
	 * @return
	 */
	public static Set<Integer> recommendNumbers(List<GameInfoForDB> gameInfos, List<AppearanceCount> appearanceCounts, Set<Integer> excludeNumbers, Set<Integer> includeNumbers) {
		// 1. 선택 가능한 번호 생성
		Set<Integer> numbers = new HashSet<Integer>(NUMBERS);

		// 2. 선택 가능한 번호 목록에서 제외/포함 시켜야할 번호 제외
		removeIncludeExcludeNumbers(numbers, includeNumbers, excludeNumbers);

		// 3. 최근 보너스 번호 2개 선택 가능 번호에서 제외
		removeLatestThreeBonusNumber(numbers, gameInfos);

		// 4. 가장 많이 나온 2개 번호 선택 가능 번호에서 제외
		removeThreeMaxAppearancedNumber(numbers, appearanceCounts);

		// 5. 번호 추첨
		// 5-1. 포함시켜야할 번호 추천 번호 목록에 추가
		Set<Integer> recommendedNumbers = new TreeSet<>();
		if (CollectionUtils.isNotEmpty(includeNumbers)) {
			recommendedNumbers.addAll(includeNumbers);
		}

		Integer randomNumber;

		// 5-2. 가장 적게 나온 번호 n개중 하나 랜덤 추첨
		randomNumber = chooseInTheLowestRamdomly(appearanceCounts);
		addAndRemoveChoicedNumber(recommendedNumbers, numbers, randomNumber);

		// 5-3. n ~ m 번째로 많이 나온 번호 중 하나 랜덤 추첨
		randomNumber = chooseBetweenFromAndToRandomly(appearanceCounts);
		addAndRemoveChoicedNumber(recommendedNumbers, numbers, randomNumber);

		// 5-4. n 주전 당첨 번호 중 하나 랜덤 추첨
//		randomNumber = chooseInTheNWeeksAgoRandomly(gameInfos);
//		addAndRemoveChoicedNumber(recommendedNumbers, numbers, randomNumber);

		// 5-5. 나머지 번호 추첨
		int choiceCount = WIN_NUMBER_COUNT - recommendedNumbers.size(); // 추첨 해야할 번호 개수

		recommendedNumbers.addAll(choiceRandomly(numbers, choiceCount));

		// 6. 6개 번호가 선택되었는지 확인
		if (recommendedNumbers.size() != WIN_NUMBER_COUNT) {
			throw new RuntimeException("Fail to choose numbers");
		}

		return recommendedNumbers;
	}

	public static Set<Integer> recommendExceptionNumbers(List<GameInfoForDB> gameInfos, List<AppearanceCount> appearanceCounts) {
		// 1. 선택 가능한 번호 생성
		Set<Integer> numbers = new HashSet<>(NUMBERS);

		// 2. 최근 보너스 번호 4개 선택 가능 번호에서 제외
		removeLatestThreeBonusNumber(numbers, gameInfos);

		// 3. 가장 많이 나온 4개 번호 선택 가능 번호에서 제외
		removeThreeMaxAppearancedNumber(numbers, appearanceCounts);

		// 5. 번호 추첨
		Set<Integer> recommendedNumbers = new TreeSet<>();
		Integer randomNumber;

		// 5-1. 가장 적게 나온 번호 n개중 하나 랜덤 추첨
		randomNumber = chooseInTheLowestRamdomly(appearanceCounts);
		addAndRemoveChoicedNumber(recommendedNumbers, numbers, randomNumber);

		// 5-2. n ~ m 번째로 많이 나온 번호 중 하나 랜덤 추첨
		randomNumber = chooseBetweenFromAndToRandomly(appearanceCounts);
		addAndRemoveChoicedNumber(recommendedNumbers, numbers, randomNumber);

		// 5-3. n 주전 당첨 번호 중 하나 랜덤 추첨
		randomNumber = chooseInTheNWeeksAgoRandomly(gameInfos);
		addAndRemoveChoicedNumber(recommendedNumbers, numbers, randomNumber);

		return recommendedNumbers;
	}

	/**
	 * 선택 가능한 번호 목록에서 제외할 번호와 포함할 번호 제거
	 * 
	 * @param numbers - 선택 가능한 번호 목록
	 * @param includeNumbers - 제외할 번호
	 * @param excludeNumbers - 포함할 번호
	 */
	static void removeIncludeExcludeNumbers(Set<Integer> numbers, Set<Integer> includeNumbers, Set<Integer> excludeNumbers) {
		if (CollectionUtils.isEmpty(numbers)) {
			throw new RuntimeException("Invalind number set!");
		}

		if (CollectionUtils.isNotEmpty(includeNumbers)) {
			numbers.removeAll(includeNumbers);
		}

		if (CollectionUtils.isNotEmpty(excludeNumbers)) {
			numbers.removeAll(excludeNumbers);
		}
	}

	/**
	 * 선택된 번호 선택 추천 번호 추가 및 선택가능 번호에서 제외
	 * 
	 * @param recommendedNumbers - 추천 번호
	 * @param numbers - 선택 가능 번호
	 * @param choicedNumber - 선택된 번호
	 */
	private static void addAndRemoveChoicedNumber(Set<Integer> recommendedNumbers, Set<Integer> numbers, Integer choicedNumber) {
		if (choicedNumber == null) {
			return;
		}

		recommendedNumbers.add(choicedNumber);
		numbers.remove(choicedNumber);
	}

	/**
	 * 번호 추첨
	 * 
	 * @param numbers - 선택 가능한 번호 목록
	 * @param selectCount - 추첨할 개수
	 * @return - 추첨된 번호
	 */
	private static Set<Integer> choiceRandomly(Set<Integer> numbers, int selectCount) {
		if (CollectionUtils.isEmpty(numbers) || numbers.size() < selectCount) {
			throw new RuntimeException("Invalid numbers set!");
		}

		// 1. 선택 가능한 번호 목록 형 변환(Set -> List)
		List<Integer> availableNumbers = new ArrayList<>(numbers);

		// 2. shuffle
		Collections.shuffle(availableNumbers);

		// 3. choose numbers
        return new TreeSet<>(availableNumbers.subList(0, selectCount));
	}

	private static final int MAX_APPEARANCE_FROM_INDEX = 9;
	private static final int MAX_APPEARANCE_TO_INDEX = 9;

	/**
	 * n ~ m 번째로 많이 나온 번호 중 하나 랜덤 선택
	 * @param appearanceCounts - 많이 나온 순서로 정렬된 번호 리스트
	 * @return - 선택된 번호
	 */
	private static Integer chooseBetweenFromAndToRandomly(List<AppearanceCount> appearanceCounts) {
		if (CollectionUtils.isEmpty(appearanceCounts) || appearanceCounts.size() < MAX_APPEARANCE_TO_INDEX) {
			return null;
		}

		int index = RandomUtils.nextInt(MAX_APPEARANCE_TO_INDEX - MAX_APPEARANCE_FROM_INDEX + 1) + MAX_APPEARANCE_FROM_INDEX - 1;
		return appearanceCounts.get(index).getNumber();
	}

	private static final int N_WEEKS_AGO = 8;

	/**
	 * N주 전 당첨 번호 중 하나 랜던 선택
	 * 
	 * @param gameInfos - 로또 당첨 정보 목록(최근 3회 정보)
	 * @return - 선택된 번호
	 */
	private static Integer chooseInTheNWeeksAgoRandomly(List<GameInfoForDB> gameInfos) {
		if (CollectionUtils.isEmpty(gameInfos) || gameInfos.size() < N_WEEKS_AGO) {
			throw new RuntimeException("Lotto info in Two weeks ago is empty!");
		}

		List<Integer> numbers = gameInfos.get(N_WEEKS_AGO - 1).getNumbers();
		int choosedIndex = RandomUtils.nextInt(numbers.size());
		return numbers.get(choosedIndex);
	}

	private static final int MIN_APPEARANCE_LIMIT_INDEX = 9;

	/**
	 * 가장 적게 나온 번호 5개중 하나 랜덤 선택
	 * 
	 * @param appearanceCounts - 가장 많이 나온 순으로 정렬된 번호 목록
	 * @return - 선택된 번호
	 */
	private static Integer chooseInTheLowestRamdomly(List<AppearanceCount> appearanceCounts) {
		if (CollectionUtils.isEmpty(appearanceCounts)) {
			return null;
		}

		int index = Math.min(appearanceCounts.size(), RandomUtils.nextInt(MIN_APPEARANCE_LIMIT_INDEX) + 1);
		AppearanceCount choiced = appearanceCounts.get(appearanceCounts.size() - index);
		return choiced.getNumber();
	}

	private static final int MAX_APPEARANCE_LIMIT_INDEX = 2;

	/**
	 * 가장 많이 나온 번호 3개를 선택 가능한 번호 목록에서 제외
	 * 
	 * @param numbers - 선택 가능 번호 목록
	 * @param appearanceCounts - 가장 많이 나온 순으로 정렬된 번호 목록
	 */
	private static void removeThreeMaxAppearancedNumber(Set<Integer> numbers, List<AppearanceCount> appearanceCounts) {
		if (CollectionUtils.isEmpty(appearanceCounts)) {
			return;
		}

		for (int i = 0; i < MAX_APPEARANCE_LIMIT_INDEX && i < appearanceCounts.size(); i++) {
			numbers.remove(appearanceCounts.get(i).getNumber());
		}
	}

	private static final int LATEST_GAME_LIMIT_INDEX = 2;

	/**
	 * 최근 3회 보너스 번호 선택 가능 목록에서 제외
	 * 
	 * @param numbers - 선택 가능 번호 목록
	 * @param gameInfos - 최근 로또 정보
	 */
	private static void removeLatestThreeBonusNumber(Set<Integer> numbers, List<GameInfoForDB> gameInfos) {
		if (CollectionUtils.isEmpty(gameInfos)) {
			return;
		}

		for (int i = 0; i < LATEST_GAME_LIMIT_INDEX && i < gameInfos.size(); i++) {
			numbers.remove(gameInfos.get(i).getBonusBall());
		}
	}
}
