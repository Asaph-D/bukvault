package com.intergiciel.reading_service;

import com.intergiciel.reading_service.config.ReadingProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(ReadingProperties.class)
public class ReadingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ReadingServiceApplication.class, args);
	}

}
