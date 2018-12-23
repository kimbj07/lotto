package statistics.bo;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import common.util.DateUtil;
import common.util.ResourceCloseUtil;
import common.util.ResourceFactory;
import instame2.error.Instame2Exception;
import statistics.dao.StatisticsDAO;
import statistics.model.StatisticsCount;
import statistics.model.StatisticsLog;
import statistics.util.StatisticsLogConvertor;

@Component
public class StatisticsBO {
    private static final Log log = LogFactory.getLog(StatisticsBO.class);

    @Autowired
    private StatisticsDAO statisticsDAO;

    public void analysisStatisticsLog() {
        analysisStatisticsLog(DateUtil.getDateOfYesterday());
    }

    public void analysisStatisticsLog(String logDate) {
        // 1. DB 로그 데이터 초기화
        clearStatisticsLog(logDate);

        // 2. 로그파일 로딩
        BufferedReader br = openStatisticsLogFile(logDate);

        Map<String, Integer> actionCount = new HashMap<String, Integer>();
        String line = null;
        while (true) {
            try {
                line = br.readLine();
                if (line == null) {
                    break;
                }

                // 3. 액션 로우 메시지 DB 저장
                StatisticsLog statisticsLog = StatisticsLogConvertor.toStatisticsLog(line);
                statisticsDAO.insertStatisticsRawLog(statisticsLog);
                increaseActionCount(actionCount, statisticsLog.getAction());
            } catch (IOException e) {
                log.error("Fail to readLine()", e);
            } catch (Exception e) {
                log.error("Fail to analysis StatisticsLog! raw string is [ " + line + " ]", e);
            }
        }

        // 4. 액션별 카운트 DB 저장
        saveActionCount(logDate, actionCount);

        // 5. 파일 close()
        ResourceCloseUtil.close(br);
    }

    public void clearStatisticsLog(String logDate) {
        statisticsDAO.deleteStatisticsRawLog(logDate);
        statisticsDAO.deleteStatisticsCount(logDate);
    }

    private void saveActionCount(String logDate, Map<String, Integer> actionCount) {
        if (CollectionUtils.isEmpty(actionCount)) {
            return;
        }

        Map<String, Object> param = new HashMap<String, Object>();
        param.put("logDate", logDate);

        for (Map.Entry<String, Integer> entry : actionCount.entrySet()) {
            param.put("action", entry.getKey());
            param.put("count", entry.getValue());
            statisticsDAO.insertActionCount(param);
        }
    }

    private void increaseActionCount(Map<String, Integer> actionCount, String action) {
        Integer count = actionCount.get(action);
        actionCount.put(action, (count == null) ? 1 : count + 1);
    }

    /**
     * 통계 로그 파일을 불러온다.
     *
     * @return
     */
    private BufferedReader openStatisticsLogFile(String logDate) {
        // statistics 로그 파일 전체 경로
        String fileFullPath = ResourceFactory.getDataResource().getStatisticsFileFullPath() + "." + logDate;

        try {
            return new BufferedReader(new FileReader(new File(fileFullPath)));
        } catch (FileNotFoundException e) {
            throw new Instame2Exception(e);
        }
    }

    public List<StatisticsCount> acquireStatisticsCount(String startDate, String endDate, String actionType) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("fromDate", startDate);
        param.put("toDate", endDate);
        if (StringUtils.isNotBlank(actionType) && StringUtils.equals("all", actionType) == false) {
            param.put("actionType", actionType);
        }

        return statisticsDAO.selectStatisticsCount(param);
    }

    public List<StatisticsLog> acquireRawStatistics(String startDate, String endDate, Integer page,
                                                    Integer pageSize) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("fromDate", startDate);
        param.put("toDate", endDate);
        param.put("from", (page - 1) * pageSize);
        param.put("count", pageSize);

        return statisticsDAO.selectRawStatistics(param);
    }

    public Integer acquireRawStatisticsTotalCount(String startDate, String endDate) {
        Map<String, Object> param = new HashMap<String, Object>();
        param.put("fromDate", startDate);
        param.put("toDate", endDate);
        return statisticsDAO.selectRawStatisticsTotalCount(param);
    }

    public Integer acquireMemberTotalCount() {
        return statisticsDAO.selectMemberTotalCount();
    }
}
