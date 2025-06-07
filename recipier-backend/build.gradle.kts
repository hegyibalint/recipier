buildscript {
    dependencies {
        classpath("org.postgresql:postgresql:42.7.4")
        classpath("org.flywaydb:flyway-database-postgresql:11.1.0")
    }
}

plugins {
    application
    id("org.flywaydb.flyway") version "11.1.0"
    id("org.springframework.boot") version "3.4.2"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.springdoc.openapi-gradle-plugin") version "1.9.0"
}

flyway {
    url = "jdbc:postgresql://localhost:5432/recipier"
    user = "postgres"
    password = "postgres"
    cleanDisabled = false

}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

application {
    mainClass = "app.recipier.Main"
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-core")
    implementation("org.jdbi:jdbi3-spring5:3.47.0")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("io.rest-assured:rest-assured")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}

openApi {
    apiDocsUrl = "http://localhost:18080/v3/api-docs"
    customBootRun {
        systemProperties = mapOf(
            "server.port" to 18080
        )
    }
}

tasks {
    test {
        useJUnitPlatform()
    }
}