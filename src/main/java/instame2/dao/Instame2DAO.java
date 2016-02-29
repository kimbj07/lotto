package instame2.dao;

import instame2.model.Instame2User;
import instame2.model.LoginParam;
import instame2.model.Me2DayUser;

import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ibatis.SqlMapClientTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class Instame2DAO {
	private static final Log log = LogFactory.getLog(Instame2DAO.class);
	private static final String NAMESPACE = "instame2.";

	@Autowired
	private SqlMapClientTemplate instame2Client;

	public void insertMe2dayUserInfo(Me2DayUser me2dayUser) {
		try {
			instame2Client.insert(NAMESPACE + "insertMe2DayUserInfo", me2dayUser);
		} catch (Exception e) {
			log.error(e); // TODO 기존에 등록되어 있는 사용자인 경우에 대한 노티 필요
		}
	}

	public void updateInstagramUserInfo(Map<String, Object> instagramUserInfo) {
		instame2Client.insert(NAMESPACE + "updateInstagramUserInfo", instagramUserInfo);
	}

	public Instame2User selectInstagramAccessToken(String objectId) {
		return (Instame2User)instame2Client.queryForObject(NAMESPACE + "selectInstagramAccessToken", objectId);
	}

	public Instame2User selectUserInfo(String me2dayUserId) {
		return (Instame2User)instame2Client.queryForObject(NAMESPACE + "selectInstame2UserInfoForMe2dayId", me2dayUserId);
	}

	public Instame2User selectUserInfo(LoginParam loginParams) {
		return (Instame2User)instame2Client.queryForObject(NAMESPACE + "selectInstame2UserInfo", loginParams);
	}

	public int deleteUserInfo(LoginParam param) {
		return instame2Client.delete(NAMESPACE + "deleteInstame2UserInfo", param);
	}
}
