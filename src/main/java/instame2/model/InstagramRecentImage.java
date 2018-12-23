package instame2.model;

import org.apache.commons.lang.StringUtils;
import org.springframework.util.Assert;

import net.sf.json.JSONObject;

public class InstagramRecentImage {
    private static final int ME2DAY_CONTENTS_MAX_LENGTH = 147;
    private static final String ELLIPSIS = "...";
    private static final String DEFAULT_CONTENTS = "\"인스타미투\":http://instame2.com 로 올린 사진입니다. ";
    private JSONObject data;

    public InstagramRecentImage(JSONObject data) {
        Assert.notNull(data, "인스타그램 최신 이미지 응답결과가 없습니다.");
        this.data = data;
    }

    public String getImageUrl() {
        return data.getJSONObject("images").getJSONObject("standard_resolution").getString("url");
    }

    public String getContext() {
        return attachInstamgramLinkUrl(getCaption());
    }

    private String getCaption() {
        JSONObject caption = data.getJSONObject("caption");

        if (caption.isNullObject()) {
            return DEFAULT_CONTENTS;
        }

        String contents = caption.containsKey("text") ? caption.getString("text") : DEFAULT_CONTENTS;
        if (StringUtils.length(contents) > ME2DAY_CONTENTS_MAX_LENGTH) {
            return StringUtils.substring(contents, ME2DAY_CONTENTS_MAX_LENGTH - ELLIPSIS.length());
        }

        return contents;

    }

    private String attachInstamgramLinkUrl(String context) {
        String link = data.getString("link");
        if (StringUtils.startsWithIgnoreCase(link, "http://")) {
            return context + " \"☆\":" + link;
        }

        return context;
    }

    private boolean hasLocation() {
        return data.containsKey("location");
    }

    public boolean hasLocationCoordinate() {
        return hasLocation() && getLocation().containsKey("longitude") && getLocation().containsKey("latitude");
    }

    private JSONObject getLocation() {
        return data.getJSONObject("location");
    }

    public double getLongitude() {
        return getLocation().getDouble("longitude");
    }

    public double getLatitude() {
        return getLocation().getDouble("latitude");
    }

    public String getLocationName() {
        return (hasLocation() && getLocation().containsKey("name")) ? getLocation().getString("name") + " " :
               "";
    }

    public String getUserName() {
        return data.getJSONObject("user").getString("username");
    }
}
