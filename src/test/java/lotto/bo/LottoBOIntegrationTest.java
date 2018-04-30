package lotto.bo;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import lotto.model.MyRankInGame;
import support.AbstractTestBase;

public class LottoBOIntegrationTest extends AbstractTestBase {
	private int N = 1;

	@Autowired
	private LottoBO lottoBO;

	@Test
	public void 최근_로또_정보_DB저장() throws Exception {
		lottoBO.saveLottoInfoToLatest();
	}

	@Test
	public void 내_번호_확인() {
		SortedSet<Integer> myNumbers = new TreeSet<Integer>();
		myNumbers.add(4);
		myNumbers.add(8);
		myNumbers.add(9);
		myNumbers.add(21);
		myNumbers.add(23);
		myNumbers.add(28);

		List<MyRankInGame> actual = lottoBO.checkMyNumbersInHistory(myNumbers);

		for (MyRankInGame myRankInGame : actual) {
			System.out.println(myRankInGame.getGameNo() + " : " + myRankInGame.getWinNumberCount());
		}
	}

	@Test
	public void 번호_랜덤_추천() {
		Set<Integer> actual = lottoBO.recommendRandomNumbers();
		System.out.println(actual);
		assertThat(actual.size(), is(6));
	}

	@Test
	public void 랜덤추천_제외번호지정() {
		Set<Integer> exceptionNumbers = lottoBO.recommendRandomNumbers();
		exceptionNumbers.addAll(lottoBO.recommendNumbers());
		Set<Integer> actual = lottoBO.recommendNumbersWithoutExceptionNumbers(exceptionNumbers.toArray(new Integer[]{}));
		System.out.println(actual);
	}

	@Test
	public void 랜덤추천_추천번호제외지정() {
		Set<Integer> exceptionNumbers = new HashSet<Integer>(lottoBO.recommendExceptionNumbers());
		Set<Integer> actual = lottoBO.recommendNumbersWithoutExceptionNumbers(exceptionNumbers.toArray(new Integer[]{}));
		System.out.println(actual);
	}

	@Test
	public void 번호_추천() {
		Set<Integer> actual = lottoBO.recommendNumbers();
		System.out.println(actual);
		assertThat(actual.size(), is(6));
	}

	@Test
	public void 번호_추천_N번반복() {
		Map<Integer, Integer> result = new HashMap<Integer, Integer>();
		for (int i = 0; i < N; i++) {
			Set<Integer> actual = lottoBO.recommendNumbers();

			for (Integer number : actual) {
				if (result.containsKey(number)) {
					result.put(number, result.get(number) + 1);
				} else {
					result.put(number, 1);
				}
			}
		}

		LinkedHashMap<Integer, Integer> sortedResult = sortByComparator(result);

		Set<Integer> recommand = new TreeSet<Integer>();
		for (Map.Entry<Integer, Integer> entry : sortedResult.entrySet()) {
			recommand.add(entry.getKey());

			if (recommand.size() >= 6) {
				break;
			}
		}

		System.out.println("\n\n");
		System.out.println("Recommand Numbers : " + recommand);
		System.out.println(sortedResult);
		System.out.println("\n\n");
	}

	private LinkedHashMap<Integer, Integer> sortByComparator(Map<Integer, Integer> unsortMap) {
		// Convert Map to List
		List<Map.Entry<Integer, Integer>> list = new LinkedList<Map.Entry<Integer, Integer>>(unsortMap.entrySet());

		// Sort list with comparator, to compare the Map values
		Collections.sort(list, new Comparator<Map.Entry<Integer, Integer>>() {
			public int compare(Map.Entry<Integer, Integer> o1, Map.Entry<Integer, Integer> o2) {
				return (o2.getValue()).compareTo(o1.getValue());
			}
		});

		// Convert sorted map back to a Map
		LinkedHashMap<Integer, Integer> sortedMap = new LinkedHashMap<Integer, Integer>();
		for (Iterator<Map.Entry<Integer, Integer>> it = list.iterator(); it.hasNext();) {
			Map.Entry<Integer, Integer> entry = it.next();
			sortedMap.put(entry.getKey(), entry.getValue());
		}

		return sortedMap;
	}
}
