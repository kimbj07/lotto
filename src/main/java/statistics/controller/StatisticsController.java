package statistics.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;

import common.util.DateUtil;
import statistics.bo.StatisticsBO;

@Controller
public class StatisticsController {
    @Autowired
    public StatisticsBO statisticsBO;

    @RequestMapping("/showStatisticsCount")
    public ModelAndView showStatisticsCount(String startDate, String endDate,
                                            @RequestParam(defaultValue = "all") String actionType)
            throws Exception {
        String fromDate = checkDateIfInvalidReturnNDaysAgo(startDate, 7);
        String toDate = checkDateIfInvalidReturnNDaysAgo(endDate, 0);

        ModelAndView mav = new ModelAndView("instame2_statistics_count");
        mav.addObject("memberTotalCount", statisticsBO.acquireMemberTotalCount());
        mav.addObject("startDate", fromDate);
        mav.addObject("endDate", toDate);
        mav.addObject("actionType", actionType);
        mav.addObject("instame2StatisticsCount",
                      statisticsBO.acquireStatisticsCount(fromDate, toDate, actionType));
        return mav;
    }

    @RequestMapping("/showRawStatistics")
    public ModelAndView showRawStatistics(@RequestParam(defaultValue = "1") Integer page,
                                          @RequestParam(defaultValue = "10") Integer pageSize, String startDate,
                                          String endDate) throws Exception {
        String fromDate = checkDateIfInvalidReturnNDaysAgo(startDate, 7);
        String toDate = checkDateIfInvalidReturnNDaysAgo(endDate, 0);

        ModelAndView mav = new ModelAndView("instame2_raw_statistics");
        mav.addObject("startDate", fromDate);
        mav.addObject("endDate", toDate);
        mav.addObject("page", page);
        mav.addObject("pageSize", pageSize);
        mav.addObject("totalCount", statisticsBO.acquireRawStatisticsTotalCount(fromDate, toDate));
        mav.addObject("instame2RawStatistics",
                      statisticsBO.acquireRawStatistics(fromDate, toDate, page, pageSize));
        return mav;
    }

    @RequestMapping("/executeStatisticsJob")
    public ModelAndView executeStatisticsJob(String logDate) {
        if (DateUtil.isYYYY_MM_DDFormat(logDate)) {
            statisticsBO.analysisStatisticsLog(logDate);
        }

        ModelAndView mav = new ModelAndView("instame2_exec_statisticst");
        return mav;
    }

    private String checkDateIfInvalidReturnNDaysAgo(String date, int nDaysAgo) {
        return DateUtil.isYYYY_MM_DDFormat(date) ? date : DateUtil.getDateOfNDaysAgo(nDaysAgo);
    }
}
