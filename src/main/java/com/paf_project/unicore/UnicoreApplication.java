package com.paf_project.unicore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.unicore")
public class UnicoreApplication {

	public static void main(String[] args) {
		SpringApplication.run(UnicoreApplication.class, args);
	}

}
