package Kursach.AptekaSystem.Controllers;

import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@Setter
@Getter
public class MainController {

    public MainController() {}

    @GetMapping("/mainPage")
    public String showMainPage(Model model) {
        return "mainPage.html";
    }

    @GetMapping("/sale")
    public String showSale(Model model) {
        return "sale.html";
    }
}
