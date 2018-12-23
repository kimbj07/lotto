package lotto.bo;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.SortedSet;
import java.util.TreeSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.ObjectUtils;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;

import support.AbstractTestBase;

public class LottoBOIntegrationTest extends AbstractTestBase {
    private int N = 1982;

    @Autowired
    private LottoBO lottoBO;

    @Test
    public void 최근_로또_정보_DB저장() throws Exception {
        lottoBO.saveLottoInfoToLatest();
    }

    @Test
    public void 내_번호_확인() {
//        SortedSet<Integer> myNumbers = Stream.of(4, 8, 9, 21, 23, 28)
//                                             .collect(Collectors.toCollection(TreeSet::new));
        SortedSet<Integer> myNumbers = Stream.of(9, 10, 13, 28, 38, 45)
                                             .collect(Collectors.toCollection(TreeSet::new));

        lottoBO.checkMyNumbersInHistory(myNumbers)
               .stream()
               .forEach(System.out::println);
    }

    @Test
    public void 번호_랜덤_추천() {
        Set<Integer> actual = lottoBO.recommendRandomNumbers();
        System.out.println(actual);
        assertThat(actual.size(), is(6));
    }

    @Test
    public void 랜덤추천_제외번호지정() {
        Set<Integer> exceptionNumbers = lottoBO.recommendRandomNumbers();
        exceptionNumbers.addAll(lottoBO.recommendNumbers());
        Set<Integer> actual = lottoBO.recommendNumbersWithoutExceptionNumbers(
                new ArrayList<>(exceptionNumbers));
        System.out.println(actual);
    }

    @Test
    public void 랜덤추천_추천번호제외지정() {
        Set<Integer> exceptionNumbers = new HashSet<>(lottoBO.recommendExceptionNumbers());
        Set<Integer> actual = lottoBO.recommendNumbersWithoutExceptionNumbers(
                new ArrayList<>(exceptionNumbers));
        System.out.println(actual);
    }

    @Test
    public void 번호_추천() {
        Set<Integer> actual = lottoBO.recommendNumbers();
        System.out.println(actual);
        assertThat(actual.size(), is(6));
    }

    @Test
    public void 번호_추천_N번반복() {
        Map<Integer, Integer> result = new HashMap<>();

        Stream.iterate(0, n -> n + 1)
              .limit(N)
              .flatMap(n -> lottoBO.recommendNumbers().stream())
              .forEach(number -> result.put(number, ObjectUtils.defaultIfNull(result.get(number), 0) + 1));

        Set<Integer> recommend = result.keySet()
                                       .stream()
                                       .sorted(Comparator.comparing(result::get))
                                       .limit(6)
                                       .collect(Collectors.toCollection(TreeSet::new));

        System.out.println("\n\n");
        System.out.println("Recommand Numbers : " + recommend);
        System.out.println("\n\n");
    }
}
