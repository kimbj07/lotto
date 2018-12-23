package instame2.bo;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.httpclient.HttpClient;
import org.apache.commons.httpclient.HttpMethod;
import org.apache.commons.httpclient.methods.GetMethod;
import org.apache.commons.httpclient.methods.PostMethod;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JSONSerializer;

import common.model.Instame2Constants;
import instame2.dao.Instame2DAO;
import instame2.error.Instame2Exception;
import instame2.model.InstagramRecentImage;
import instame2.model.Instame2User;
import instame2.model.InstragramUserAccess;
import instame2.model.LoginParam;
import instame2.model.Me2DayUser;
import instame2.util.FileUploader;

@Component
public class Instame2BO {
    private static final Log log = LogFactory.getLog(Instame2BO.class);
    @Autowired
    private FileUploader fileUploader;

    @Autowired
    private Instame2DAO instame2DAO;

    public void registerUser(String code, String me2dayUserId) {
        PostMethod post = new PostMethod(Instame2Constants.INSTAGRAM_ACCESS_TOKEN_URL);
        post.addParameters(Instame2Constants.DEFAULT_PARAMS);
        post.addParameter("grant_type", "authorization_code");
        post.addParameter("redirect_uri", Instame2Constants.REGISTER_URL + "?me2dayUserId=" + me2dayUserId);
        post.addParameter("code", code);

        InstragramUserAccess userAccess = (InstragramUserAccess) JSONObject.toBean(executeRequest(post),
                                                                                   InstragramUserAccess.class);
        String instagramKey = registerSubscription(userAccess.getAccess_token());
        insertInstagramUserInfo(me2dayUserId, userAccess, instagramKey);
    }

    @SuppressWarnings("unchecked")
    public String registerSubscription(String accessToken) {
        PostMethod post = new PostMethod(Instame2Constants.INSTAGRAM_SUBSCRIPTIONS_URL);
        post.addParameters(Instame2Constants.DEFAULT_PARAMS);
        post.addParameters(Instame2Constants.SUBSRIPTIONS_PARAMS);
        post.addParameter("verify_token", accessToken);

        JSONObject json = executeRequest(post);
        return (String) ((Map<String, Object>) json.get("data")).get("id");
    }

    private void insertInstagramUserInfo(String me2dayUserId, InstragramUserAccess userAccess,
                                         String instagramSubscriptionId) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("me2dayId", me2dayUserId);
        param.put("instagramSubscriptionId", instagramSubscriptionId);
        param.put("instagramObjectId", userAccess.getObjectId());
        param.put("instagramUserName", userAccess.getUserName());
        param.put("instagramAccessTocken", userAccess.getAccess_token());
        instame2DAO.updateInstagramUserInfo(param);
    }

    public Instame2User acquireInstame2User(String me2dayUserId) {
        return instame2DAO.selectUserInfo(me2dayUserId);
    }

    public Instame2User inquireInstame2User(String me2dayId, String instagramUserName) {
        return instame2DAO.selectUserInfo(new LoginParam(me2dayId, instagramUserName));
    }

    /**
     * 미투데이 로그인 기반 인증 URL 을 받아온다.
     * @return
     * @throws Exception
     */
    public String acquireMe2DayAuthUrl() throws Exception {
        JSONObject json = executeRequest(new PostMethod(Instame2Constants.ME2DAY_GET_AUTH_URL));
        return json.getString("url");
    }

    /**
     * 미투데이 사용자 키를 DB 에 저장한다.
     * @param userId
     * @param userKey
     * @return
     * @throws Exception
     */
    public Me2DayUser saveMe2dayUserKey(String userId, String userKey) {
        Me2DayUser me2dayUser = acquireMe2dayUserKey(userId);
        me2dayUser.setUserId(userId);
        me2dayUser.setUserKey(userKey);
        instame2DAO.insertMe2dayUserInfo(me2dayUser); // 미투 정보 DB 저장
        return me2dayUser;
    }

    @SuppressWarnings("unchecked")
    public void syncMe2Day(String requestBody) {
        JSONArray updateList = (JSONArray) JSONSerializer.toJSON(requestBody);

        int updateCount = updateList.size();

        if (updateCount <= 0) {
            return;
        }

        String objectId = updateList.getJSONObject(0).getString("object_id");
        Instame2User userInfo = instame2DAO.selectInstagramAccessToken(objectId);

        if (userInfo == null) {
            throw new Instame2Exception(
                    Instame2Constants.ERROR + "미등록된 사용자입니다.\n인스타그램 ObjectId : " + objectId + "\n");
        }

        JSONObject updateDetail = acquireUpdateDetail(userInfo.getInstagramAccessTocken(), updateCount);
        List<JSONObject> updateData = (List<JSONObject>) updateDetail.get("data");

        for (JSONObject data : updateData) {
            fileUploader.uploadFile(userInfo, new InstagramRecentImage(data));
        }
    }

    private JSONObject acquireUpdateDetail(String accessToken, int count) {
        GetMethod get = new GetMethod(Instame2Constants.INSTAGRAM_FEED_URL + accessToken + "&count=" + count);
        return executeRequest(get);
    }

    private Me2DayUser acquireMe2dayUserKey(String userId) {
        JSONObject me2dayUser = executeRequest(
                new PostMethod(Instame2Constants.ME2DAY_GET_PERSON + userId + ".json"));
        return new Me2DayUser(me2dayUser);
    }

    private JSONObject executeRequest(HttpMethod method) {
        JSONObject json = null;
        try {
            new HttpClient().executeMethod(method);
            json = (JSONObject) JSONSerializer.toJSON(
                    IOUtils.toString(method.getResponseBodyAsStream(), "UTF-8"));
        } catch (Exception e) {
            log.error(e, e);
        } finally {
            method.releaseConnection();
        }

        return json;
    }

    public Object acquireInstagramAuthUrl(String me2dayUserId) {
        return Instame2Constants.INSTAGRAM_USER_AUTHORIZATION_URL + "?me2dayUserId=" + me2dayUserId;
    }

    public int leave(String me2dayId, String instagramUserName) {
        return instame2DAO.deleteUserInfo(new LoginParam(me2dayId, instagramUserName));
    }

    public void setInstame2DAO(Instame2DAO instame2DAO) {
        this.instame2DAO = instame2DAO;
    }
}
