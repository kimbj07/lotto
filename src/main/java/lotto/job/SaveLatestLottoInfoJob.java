package lotto.job;

import java.text.ParseException;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lotto.bo.LottoBO;

@Component
public class SaveLatestLottoInfoJob {
    private static final Log log = LogFactory.getLog(SaveLatestLottoInfoJob.class);

    @Autowired
    private LottoBO lottoBO;

    /**
     * 토요일 10시에 배치 실행
     * @throws InterruptedException
     * @throws ParseException
     */
    @Scheduled(cron = "0 0 22 * * SAT")
    public void execute() throws ParseException, InterruptedException {
        long startTime = System.currentTimeMillis();

        // 배치 로그 실행 시작
        lottoBO.saveLottoInfoToLatest();

        log.info("Executed time : " + (System.currentTimeMillis() - startTime) + "ms");
    }
}
