package lotto.bo;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.util.List;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import lotto.model.MyRankInGame;
import support.AbstractTestBase;

public class LottoBOIntegrationTest extends AbstractTestBase {
	@Autowired
	private LottoBO lottoBO;

//		@Ignore
	@Test
	public void 최근_로또_정보_DB저장() throws Exception {
		lottoBO.saveLottoInfoToLatest();
	}

	@Test
	public void 내_번호_확인() {
		SortedSet<Integer> myNumbers = new TreeSet<Integer>();
		myNumbers.add(9);
		myNumbers.add(14);
		myNumbers.add(15);
		myNumbers.add(31);
		myNumbers.add(33);
		myNumbers.add(23);

		List<MyRankInGame> actual = lottoBO.checkMyNumbersInHistory(myNumbers);
		MyRankInGame myRankInGame;

		myRankInGame = actual.get(0);
		assertThat(myRankInGame.getGameNo(), is(46));
		assertThat(myRankInGame.getWinNumberCount(), is(3));
		assertThat(myRankInGame.getBounsNumberCount(), is(0));

		myRankInGame = actual.get(9);
		assertThat(myRankInGame.getGameNo(), is(533));
		assertThat(myRankInGame.getWinNumberCount(), is(5));
		assertThat(myRankInGame.getBounsNumberCount(), is(1));
	}

	@Test
	public void 번호_추천() {
		Set<Integer> actual = lottoBO.recommendNumbers();
		System.out.println(actual);
		assertThat(actual.size(), is(6));
	}
}
