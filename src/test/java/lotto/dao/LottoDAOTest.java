package lotto.dao;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.util.List;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import lotto.model.AppearanceCount;
import lotto.model.GameInfoForDB;
import lotto.param.AppearanceCountParam;
import lotto.param.GameInfoInRangeParam;
import support.AbstractTestBase;

public class LottoDAOTest extends AbstractTestBase {
	@Autowired
	private LottoDAO lottoDAO;

	@Test
	public void selectAppearanceCountTest() {
		List<AppearanceCount> actual = lottoDAO.selectAppearanceCount(new AppearanceCountParam());
		assertThat(actual.size(), is(45));
	}

	@Test
	public void selectGameInfoInRnageTest() {
		List<GameInfoForDB> actual = lottoDAO.selectGameInfoInRange(new GameInfoInRangeParam());
		System.out.println(actual);
	}
}