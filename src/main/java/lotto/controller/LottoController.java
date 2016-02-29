package lotto.controller;

import lotto.bo.LottoBO;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class LottoController {
	private static final Log log = LogFactory.getLog(LottoController.class);

	@Autowired
	public LottoBO lottoBO;

	@ExceptionHandler(Exception.class)
	public ModelAndView exceptionHandler(Exception exception) {
		return new ModelAndView("lotto/main");
	}

	@RequestMapping("/lotto/init")
	public ModelAndView lotteInit() throws Exception {
		lottoBO.saveLottoInfoToLatest();
		return new ModelAndView("lotto/main");
	}
}
