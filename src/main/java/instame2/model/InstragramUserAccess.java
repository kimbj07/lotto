package instame2.model;

import java.util.Map;

public class InstragramUserAccess {
    private String access_token;
    private Map<String, Object> user;

    public String getAccess_token() {
        return access_token;
    }

    public void setAccess_token(String access_token) {
        this.access_token = access_token;
    }

    public Map<String, Object> getUser() {
        return user;
    }

    public void setUser(Map<String, Object> user) {
        this.user = user;
    }

    /**
     * 인스타그램에서 발급한 사용자 키를 반환한다.
     *
     * @return
     */
    public String getObjectId() {
        return (String) user.get("id");
    }

    public String getUserName() {
        return (String) user.get("username");
    }

    public String getUserFullName() {
        return (String) user.get("full_name");
    }
}
