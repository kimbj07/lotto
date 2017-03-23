package lotto.bo;

import java.security.InvalidParameterException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.ObjectUtils;
import org.apache.commons.lang.math.RandomUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import net.sf.json.JSONObject;

import lotto.dao.LottoDAO;
import lotto.model.AppearanceCount;
import lotto.model.GameInfoForApi;
import lotto.model.GameInfoForDB;
import lotto.model.MyRankInGame;
import lotto.param.AppearanceCountParam;
import lotto.param.GameInfoInRangeParam;
import lotto.util.GameInfoConvert;
import lotto.util.LottoApiRequestHelper;
import lotto.util.LottoConstant;
import lotto.util.LottoRandomMachine;
import lotto.util.LottoURL;

@Component
public class LottoBO {
	private static final Log log = LogFactory.getLog(LottoBO.class);
	private final int LOTTO_MAX_NUMBER = 45;
	private final int SELECT_COUNT = 6;

	@Autowired
	public LottoDAO lottoDAO;

	/**
	 * 가장 최근까지의 로또 정보를 DB에 저장한다.  
	 * 
	 * @throws ParseException
	 * @throws InterruptedException
	 */
	public void saveLottoInfoToLatest() throws ParseException, InterruptedException {
		// 1. 가장 최근의 로또 추첨 횟수 조회(LottoAPI 호출)		
		int latestGameNo = acquireLatestGameNo();

		// 2. DB에 저장되어 있는 가장 최근의 로또 추첨횟수 조회
		int lastSavedGameNo = lottoDAO.selectLastSavedGameNo();

		// 3. DB에 저장되어 있지 않은 로또 정보 저장
		for (int gameNo = lastSavedGameNo + 1; gameNo <= latestGameNo; gameNo++) {
			log.info("Start to save " + gameNo + "th Lotto Info");
			JSONObject responseGameNo = (JSONObject)LottoApiRequestHelper.executeRequest(LottoURL.GAME_INFO + gameNo);
			saveGameInfo(responseGameNo);
			Thread.sleep(2000);
			log.info("Complete to save " + gameNo + "th Lotto Info");
		}
	}

	/**
	 * 가장 최근 로또 추첨 횟수 조회(LottoAPI 호출)
	 * 
	 * @return - 가장 최근 로또 회차
	 */
	private int acquireLatestGameNo() {
		JSONObject latestGameInfo = (JSONObject)LottoApiRequestHelper.executeRequest(LottoURL.LATEST_GAME_INFO);
		if (latestGameInfo == null) {
			log.error("Fail to acquire latest game info!");
			return 0;
		}

		return latestGameInfo.getInt(LottoConstant.Api.GAME_NO);
	}

	/**
	 * 로또 추첨 정보 DB 저장
	 * 
	 * @param responseGameInfo - 로또 추첨 정보(json)
	 */
	private void saveGameInfo(JSONObject responseGameInfo) {
		GameInfoForApi gameInfo;
		try {
			gameInfo = GameInfoConvert.convertTo(responseGameInfo);
		} catch (ParseException e) {
			log.error("Fail to convert from json response to GameInfo Bean!", e);
			return;
		}

		lottoDAO.insertGameInfo(gameInfo);
		lottoDAO.insertWinnerBalls(gameInfo.getGameNo(), gameInfo.getBalls());
		lottoDAO.insertBonusBall(gameInfo.getGameNo(), gameInfo.getBonusBall());
	}

	/**
	 * 내 번호(입력된 번호)의 역대 당첨 이력 확인
	 * 
	 * @param myNumbers - 내 번호
	 * @return - 당첨 정보 리스트
	 */
	public List<MyRankInGame> checkMyNumbersInHistory(SortedSet<Integer> myNumbers) {
		if (CollectionUtils.isEmpty(myNumbers) || myNumbers.size() != LottoConstant.NUMBER_COUNT) {
			throw new InvalidParameterException("조회 번호가 잘못되었습니다.");
		}

		if ((Integer)ObjectUtils.defaultIfNull(myNumbers.first(), 0) < LottoConstant.FIRST_NUMBER //
			|| LottoConstant.LAST_NUMBER < (Integer)ObjectUtils.defaultIfNull(myNumbers.last(), 0)) {
			throw new InvalidParameterException("조회 번호가 잘못되었습니다.");
		}

		return lottoDAO.selectMyRankInHistory(myNumbers);
	}

	/**
	 * 번호별 등장 횟수 조회
	 * 
	 * @param from - 조회 시작 회차
	 * @param to - 조회 종료 회차
	 * @param sortBy - 정렬 기준(winCount : 당첨 번호 등장 횟수(기본), bonusCount : 보너스 번호 등장 횟수, sumCount : 전체(당첨번호 + 보너스 번호) 등장 횟수, number : 번호)
	 * @param order - 정렬 방식(ASC : sortBy가 number 인경우 기본, DESC : 기본)
	 * @return - 번호별 등장 횟수 리스트
	 */
	public List<AppearanceCount> acquireAppreanceCount(Integer from, Integer to, Integer count, String sortBy, String order) {
		AppearanceCountParam params = new AppearanceCountParam(from, to, count, sortBy, order);
		return lottoDAO.selectAppearanceCount(params);
	}

	/**
	 * 로또 추첨 정보 조회
	 * 
	 * @param from - 조회 시작 회차
	 * @param to - 조회 종료 회차
	 * @param order - 정렬 방식(ASC, DESC : 기본)
	 * @return - 로또 추첨 정보 리스트
	 */
	public List<GameInfoForDB> acquireGameInfoInRange(Integer from, Integer to, String order) {
		GameInfoInRangeParam params = new GameInfoInRangeParam(from, to, order);
		return lottoDAO.selectGameInfoInRange(params);
	}

	/**
	 * 번호 랜덤 추천 
	 * 
	 * @return
	 */
	public Set<Integer> recommendNumbers() {
		// 1. 최근 N회 로또 정보 조회
		List<GameInfoForDB> gameInfos = acquireLatestThreeGameInfo();

		// 2. 가장 많이 나온 번호 순 조회
		List<AppearanceCount> appearanceCounts = lottoDAO.selectAppearanceCount(new AppearanceCountParam()); // 가장 많이 나온 번호 조회

		// 3. 번호 추첨
		return LottoRandomMachine.recommendNumbers(gameInfos, appearanceCounts);
	}

	/**
	 * 제외번호를 제외한 램덤 추천
	 * 
	 * @param exceptionNumbers
	 * @return
	 */
	public Set<Integer> recommendNumbersWithoutExceptionNumbers(Integer[] exceptionNumbers) {
		Set<Integer> numbers = new HashSet<Integer>();
		for (int i = 1; i <= LOTTO_MAX_NUMBER; i++) {
			numbers.add(i);
		}
		
		for (int number : exceptionNumbers) {
			numbers.remove(number);
		}
		
		List<Integer> candidateNumbers = new ArrayList<Integer>(numbers);
		Collections.shuffle(candidateNumbers);
		
		Set<Integer> recommendNumbers = new TreeSet<>();
		while (true) {
			int index = RandomUtils.nextInt(candidateNumbers.size());
			int canidateNumber = candidateNumbers.get(index);
			if (recommendNumbers.contains(canidateNumber) == false) {
				recommendNumbers.add(candidateNumbers.get(index));
			}
			
			if (recommendNumbers.size() == SELECT_COUNT) {
				break;
			}
		}
		
		return recommendNumbers;
	}

	/**
	 * 랜덤 번호 추출
	 * 
	 * @return
	 */
	public Set<Integer> recommendRandomNumbers() {
		final Map<Integer, Integer> numbers = new HashMap<Integer, Integer>();
		
		for (int i = 1; i <= LOTTO_MAX_NUMBER; i++) {
			numbers.put(i, 0);
		}
		
		for (int i = 0; i < 82921; i++) {
			int random = RandomUtils.nextInt(LOTTO_MAX_NUMBER) + 1;
			numbers.put(random, numbers.get(random) + 1);
		}
		
		List<Integer> keys = new ArrayList<Integer>(numbers.keySet());

		Collections.sort(keys, new Comparator<Integer>() {
			@Override
			public int compare(Integer o1, Integer o2) {
				Integer v1 = numbers.get(o1);
				Integer v2 = numbers.get(o2);
				return v1.compareTo(v2);
			}
		});

		Collections.reverse(keys);
		return new TreeSet<Integer>(keys.subList(0,  SELECT_COUNT));
	}

	/**
	 * 최근 10회 로또 정보 조회
	 * @return
	 */
	private List<GameInfoForDB> acquireLatestThreeGameInfo() {
		// 1. 가장 최근 로또 회차 조회
		int lastSavedGameNo = lottoDAO.selectLastSavedGameNo();

		// 2. 최근 3회 로또 정보 조회
		GameInfoInRangeParam param = new GameInfoInRangeParam();
		param.setFrom(Math.max(0, lastSavedGameNo - 10));
		param.setTo(lastSavedGameNo);

		return lottoDAO.selectGameInfoInRange(param);
	}

}
