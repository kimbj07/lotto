package instame2.model;

import static org.junit.Assert.assertEquals;

import java.io.IOException;
import java.util.List;

import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import org.apache.commons.io.FileUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"/application-context.xml"})
public class InstagramRecentImageTest {
	@Test
	@SuppressWarnings("unchecked")
	public void 인스타그램_사용자명_검증() throws IOException {
		String recentImageJsonText = FileUtils.readFileToString(FileUtils.toFile(this.getClass().getResource("/recent_image.json")));
		JSONObject recentImage = (JSONObject)JSONSerializer.toJSON(recentImageJsonText);

		List<JSONObject> datas = (List<JSONObject>)recentImage.getJSONArray("data");
		InstagramRecentImage instagramRecentImage = new InstagramRecentImage(datas.get(0));
		assertEquals("tigger_j", instagramRecentImage.getUserName());
	}
}
