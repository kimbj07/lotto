package statistics.util;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import common.model.Instame2Constants;
import instame2.model.InstagramRecentImage;
import instame2.model.Instame2User;
import statistics.dao.StatisticsDAO;

@Component
public class StatisticsUtil {
    private static final Log log = LogFactory.getLog(StatisticsUtil.class);
    private static StatisticsDAO statisticsDAO;

    public static void logUploadImageInfo(Instame2User userInfo, InstagramRecentImage data) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("me2dayUserId", userInfo.getMe2dayId());
        param.put("imageUrl", data.getImageUrl());
        statisticsDAO.insertUploadImageInfo(param);
    }

    public static void logStatistics(String action, String message) {
        StringBuffer sb = new StringBuffer();

        sb.append(Instame2Constants.STATISTICS_OPEN);
        sb.append(action);
        sb.append(Instame2Constants.DELEMETER);
        sb.append(message);
        sb.append(Instame2Constants.STATISTICS_CLOSE);

        log.info(sb.toString());
    }

    public static void info(String message) {
        log.info(message);
    }

    @Autowired
    public void setStatisticsDAO(StatisticsDAO statisticsDAO) {
        StatisticsUtil.statisticsDAO = statisticsDAO;
    }
}
