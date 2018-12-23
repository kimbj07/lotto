package common.util;

import java.util.Calendar;
import java.util.Locale;
import java.util.regex.Pattern;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.time.FastDateFormat;

import common.model.Instame2Constants;

public class DateUtil {
    private static final Pattern YYYY_MM_DD_PATTERN = Pattern.compile("\\d{4}-\\d{2}-\\d{2}");

    public static String getDateOfYesterday() {
        return getDateOfNDaysAgo(1);
    }

    public static String getDateOfNDaysAgo(int nDaysAgo) {
        int nDaysAgoTmp = (nDaysAgo > 0) ? nDaysAgo : 0;
        Calendar yesterday = Calendar.getInstance(Locale.KOREA);
        yesterday.add(Calendar.DATE, -nDaysAgoTmp);
        return FastDateFormat.getInstance(Instame2Constants.LOG_FILE_DATE_FORMAT, Locale.KOREAN).format(
                yesterday);
    }

    public static boolean isYYYY_MM_DDFormat(String date) {
        return StringUtils.isNotEmpty(date) && YYYY_MM_DD_PATTERN.matcher(date).find();
    }
}
