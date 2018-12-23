package statistics.dao;

import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.orm.ibatis.SqlMapClientTemplate;
import org.springframework.stereotype.Repository;

import statistics.model.StatisticsCount;
import statistics.model.StatisticsLog;

@Repository
public class StatisticsDAO {
    private static final Log log = LogFactory.getLog(StatisticsDAO.class);
    private static final String NAMESPACE = "statistics.";

    @Autowired
    private SqlMapClientTemplate instame2Client;

    /**
     * 미투데이로 싱크된 이미지 URL 저장
     *
     * @param param
     */
    public void insertUploadImageInfo(Map<String, Object> param) {
        log.info("insertUploadImageInfo : " + param);
    }

    /**
     * 통계 원본 메세지 저장
     *
     * @param statisticsLog
     */
    public void insertStatisticsRawLog(StatisticsLog statisticsLog) {
        instame2Client.insert(NAMESPACE + "insertStatisticsRawLog", statisticsLog);
    }

    /**
     * 액션별 카운트 통계 저장 - 통계용
     *
     * @param actionCount
     */
    public void insertActionCount(Map<String, Object> param) {
        instame2Client.insert(NAMESPACE + "insertActionCount", param);
    }

    @SuppressWarnings("unchecked")
    public List<StatisticsCount> selectStatisticsCount(Map<String, Object> param) {
        return (List<StatisticsCount>) instame2Client.queryForList(NAMESPACE + "selectStatisticsCount", param);
    }

    @SuppressWarnings("unchecked")
    public List<StatisticsLog> selectRawStatistics(Map<String, Object> param) {
        return (List<StatisticsLog>) instame2Client.queryForList(NAMESPACE + "selectRawStatistics", param);
    }

    public Integer selectRawStatisticsTotalCount(Map<String, Object> param) {
        return (Integer) instame2Client.queryForObject(NAMESPACE + "selectRawStatisticsTotalCount", param);
    }

    public Integer selectMemberTotalCount() {
        return (Integer) instame2Client.queryForObject(NAMESPACE + "selectMemberTotalCount");
    }

    public Integer deleteStatisticsRawLog(String logDate) {
        return instame2Client.delete(NAMESPACE + "deleteStatisticsRawLog", logDate);
    }

    public Integer deleteStatisticsCount(String logDate) {
        return instame2Client.delete(NAMESPACE + "deleteStatisticsCount", logDate);
    }
}
