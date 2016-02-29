package instame2.bo;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import instame2.dao.Instame2DAO;
import instame2.model.Instame2User;
import instame2.model.Me2DayUser;

import org.apache.commons.io.FileUtils;
import org.junit.After;
import org.junit.Ignore;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"/application-context.xml"})
public class Instame2BOTest {
	private static final String TEST_USER = "kimbj07";
	private static final String TEST_KEY = "07980840";

	@Autowired
	private Instame2BO instame2BO;

	@Autowired
	private Instame2DAO instame2DAO;

	@After
	public void after() {
		instame2BO.setInstame2DAO(instame2DAO); // spy 된 객체 원복
	}

	// 실제 미투데이에 연동
	@Ignore
	@Test
	public void 인스타그램_최신이미지_미투데이_연동테스트() throws Exception {
		// SPY DAO
		Instame2DAO spyInstame2DAO = spy(new Instame2DAO());
		doReturn(getMockUserInfo()).when(spyInstame2DAO).selectInstagramAccessToken(Mockito.anyString());
		instame2BO.setInstame2DAO(spyInstame2DAO);
		instame2BO.syncMe2Day(FileUtils.readFileToString(FileUtils.toFile(this.getClass().getResource("/receving_updates.json"))));

	}

	private Instame2User getMockUserInfo() {
		Instame2User mockUser = new Instame2User();
		mockUser.setInstagramAccessTocken("9686940.91c3c93.601f7a6f98ff4eda9baf0b827646eac5");
		mockUser.setMe2dayId(TEST_USER);
		mockUser.setMe2dayKey(TEST_KEY);
		mockUser.setInstagramUserName("tigger_j");
		return mockUser;
	}

	@Test
	public void 미투데이_사용자_정보조회테스트() {
		// SPY DAO
		Instame2DAO spyInstame2DAO = spy(new Instame2DAO());
		doNothing().when(spyInstame2DAO).insertMe2dayUserInfo((Me2DayUser)Mockito.anyObject());
		instame2BO.setInstame2DAO(spyInstame2DAO);

		Me2DayUser me2User = instame2BO.saveMe2dayUserKey(TEST_USER, TEST_KEY);
		assertEquals(me2User.getUserId(), TEST_USER);
		assertEquals(me2User.getUserKey(), TEST_KEY);
		assertEquals(me2User.getNickname(), "냉정우물가의소년들");
	}
}
