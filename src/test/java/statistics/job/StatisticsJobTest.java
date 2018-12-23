package statistics.job;

import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import support.AbstractTestBase;

public class StatisticsJobTest extends AbstractTestBase {
    @Autowired
    private StatisticsJob statisticsJob;

    //	@Ignore
    @Test
    public void 통계_배치작업_실행() {
        statisticsJob.execute();
    }

}
