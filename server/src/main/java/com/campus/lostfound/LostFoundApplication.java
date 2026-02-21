package com.campus.lostfound;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LostFoundApplication {

    public static void main(String[] args) {
        SpringApplication.run(LostFoundApplication.class, args);
    }
}
