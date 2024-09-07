import app.recipier.buildsrc.PostgresContainerService

buildscript {
    dependencies {
        classpath("org.flywaydb:flyway-database-postgresql:10.15.2")
    }
}

plugins {
    id("org.flywaydb.flyway") version "10.15.2"
    id("io.micronaut.application") version "4.4.0"
    id("io.micronaut.aot") version "4.4.0"
}

group = "app.recipier"
version = "1.0-SNAPSHOT"

dependencies {
    annotationProcessor("io.micronaut:micronaut-http-validation")
    annotationProcessor("io.micronaut.serde:micronaut-serde-processor")
    annotationProcessor("io.micronaut.data:micronaut-data-processor")
    annotationProcessor("io.micronaut.validation:micronaut-validation-processor")

    implementation("io.micronaut.flyway:micronaut-flyway")
    implementation("io.micronaut.serde:micronaut-serde-jackson")
    implementation("io.micronaut.validation:micronaut-validation")
    implementation("io.micronaut.sql:micronaut-jdbc-hikari")
    implementation("io.micronaut.sql:micronaut-jdbi")
    implementation("org.jdbi:jdbi3-sqlobject")

    compileOnly("io.micronaut:micronaut-http-client")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("ch.qos.logback:logback-classic")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.yaml:snakeyaml")

    testImplementation("io.micronaut:micronaut-http-client")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("io.rest-assured:rest-assured")
}

application {
    mainClass = "app.recipier.Application"
}

flyway {
    url = "jdbc:postgresql://localhost:5432/recipier"
    user = "postgres"
    password = "postgres"
    cleanDisabled = false
    baselineOnMigrate = true
    cleanOnValidationError = true
}

micronaut {
    runtime("netty")
    testRuntime("junit5")

    processing {
        incremental(true)
        annotations("app.recipier.*")
    }

    aot {
        optimizeServiceLoading = false
        convertYamlToJava = false
        precomputeOperations = true
        cacheEnvironment = true
        optimizeClassLoading = true
        deduceEnvironment = true
        optimizeNetty = true
        replaceLogbackXml = true
    }
}

java {
   toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
   }
}

graalvmNative {
    toolchainDetection = false
}

tasks{
    test {
        useJUnitPlatform()
    }
}