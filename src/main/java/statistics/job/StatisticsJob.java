package statistics.job;

import instame2.error.Instame2Exception;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import statistics.bo.StatisticsBO;
import statistics.util.StatisticsUtil;

@Component
public class StatisticsJob {
	private static boolean isRunning = false;

	@Autowired
	private StatisticsBO statisticsBO;

	/**
	 * 매일 새벽 4시에 통계 로그 수집
	 */
	@Scheduled(cron = "0 0 4 * * *")
	public void execute() {
		start();
		long startTime = System.currentTimeMillis();

		// 배치 로그 실행 시작
		statisticsBO.analysisStatisticsLog();

		StatisticsUtil.info("Executed time : " + (System.currentTimeMillis() - startTime) + "ms");
		end();
	}

	synchronized private void start() {
		if (isRunning) {
			throw new Instame2Exception("Job is already running");
		} else {
			isRunning = true;
			StatisticsUtil.info("Execute statistics job!");
		}
	}

	synchronized private void end() {
		isRunning = false;
		StatisticsUtil.info("End statistics job!");
	}
}
