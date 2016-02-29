package lotto.util;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertThat;

import java.util.Set;
import java.util.TreeSet;

import org.junit.Test;

public class LottoRandomMachineTest {

	@Test
	public void removeIncludeExcludeNumbersTest() {
		Set<Integer> mockNumbers = new TreeSet<Integer>();
		mockNumbers.add(2);
		mockNumbers.add(3);
		mockNumbers.add(4);
		mockNumbers.add(5);
		mockNumbers.add(6);

		Set<Integer> includeNumbers = new TreeSet<Integer>();
		includeNumbers.add(1);
		includeNumbers.add(2);

		Set<Integer> excludeNumbers = new TreeSet<Integer>();
		excludeNumbers.add(5);
		excludeNumbers.add(6);

		Set<Integer> expected = new TreeSet<Integer>();
		expected.add(3);
		expected.add(4);

		LottoRandomMachine.removeIncludeExcludeNumbers(mockNumbers, includeNumbers, excludeNumbers);
		assertThat(mockNumbers.equals(expected), is(true));
	}
}
