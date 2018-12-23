package instame2.model;

import org.apache.commons.lang.builder.ToStringBuilder;

import net.sf.json.JSONObject;

public class Me2DayUser {
    private String userId;
    private String userKey;
    private String nickname;
    private String face;

    public Me2DayUser(JSONObject userInfo) {
        this.nickname = userInfo.getString("nickname");
        this.face = userInfo.getString("face");

        System.out.println();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserKey() {
        return userKey;
    }

    public void setUserKey(String userKey) {
        this.userKey = userKey;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getFace() {
        return face;
    }

    public void setFace(String face) {
        this.face = face;
    }

    @Override
    public String toString() {
        return ToStringBuilder.reflectionToString(this);
    }

}
