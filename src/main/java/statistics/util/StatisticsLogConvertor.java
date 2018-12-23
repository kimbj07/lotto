package statistics.util;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.StringUtils;

import common.model.Instame2Constants;
import instame2.error.Instame2Exception;
import statistics.model.StatisticsLog;

public class StatisticsLogConvertor {
    public static StatisticsLog toStatisticsLog(String rawData) {
        // 톰캣 로깅 시간 추출
        String loggingTime = StringUtils.substring(rawData, 0,
                                                   Instame2Constants.TOMCAT_LOGGING_TIME_FORMAT.length());

        // 액션 및 메시지 추출
        String refinedLog = StringUtils.substringBetween(rawData, Instame2Constants.STATISTICS_OPEN,
                                                         Instame2Constants.STATISTICS_CLOSE);
        String[] analyzedStatisticsLog = StringUtils.split(refinedLog, Instame2Constants.DELEMETER);

        if (ArrayUtils.isEmpty(analyzedStatisticsLog) || analyzedStatisticsLog.length < 2) {
            throw new Instame2Exception("Fail to construct StatisticsLog instance!");
        }

        // StatisticsLog 객체 생성
        StatisticsLog statisticsLog = new StatisticsLog();
        statisticsLog.setAction(analyzedStatisticsLog[0]);
        statisticsLog.setMessage(analyzedStatisticsLog[1]);
        statisticsLog.setLoggingTime(loggingTime);

        return statisticsLog;
    }
}
