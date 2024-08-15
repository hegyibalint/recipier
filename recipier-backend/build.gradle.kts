import app.recipier.buildsrc.PostgresContainerService
import org.jooq.meta.jaxb.Logging

buildscript {
    dependencies {
        classpath("org.flywaydb:flyway-database-postgresql:10.15.2")
    }
}

plugins {
    id("org.flywaydb.flyway") version "10.15.2"
    id("nu.studer.jooq") version "9.0"
    id("io.micronaut.application") version "4.4.0"
    id("io.micronaut.aot") version "4.4.0"
}

group = "app.recipier"
version = "1.0-SNAPSHOT"

dependencies {
    jooqGenerator("org.postgresql:postgresql:42.7.3")

    annotationProcessor("io.micronaut:micronaut-http-validation")
    annotationProcessor("io.micronaut.serde:micronaut-serde-processor")
    annotationProcessor("io.micronaut.data:micronaut-data-processor")
    annotationProcessor("io.micronaut.validation:micronaut-validation-processor")

    implementation("io.micronaut.flyway:micronaut-flyway")
    implementation("io.micronaut.serde:micronaut-serde-jackson")
    implementation("io.micronaut.validation:micronaut-validation")
    implementation("io.micronaut.sql:micronaut-jooq")
    implementation("io.micronaut.sql:micronaut-jdbc-hikari")

    compileOnly("io.micronaut:micronaut-http-client")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("ch.qos.logback:logback-classic")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.yaml:snakeyaml")

    testImplementation("io.micronaut:micronaut-http-client")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.assertj:assertj-core")
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

jooq {
    configurations {
        configurations {
            create("main") {
                jooqConfiguration.apply {
                    logging = Logging.WARN
                    generateSchemaSourceOnCompilation = false
                    jdbc.apply {
                        driver = "org.postgresql.Driver"
                        url = "jdbc:postgresql://localhost:5432/recipier"
                        user = "postgres"
                        password = "postgres"
                    }
                    generator.apply {
                        name = "org.jooq.codegen.DefaultGenerator"
                        database.apply {
                            name = "org.jooq.meta.postgres.PostgresDatabase"
                            inputSchema = "public"
                            excludes = "flyway_schema_history"
                        }
                        generate.apply {
                            isDeprecated = false
                            isRecords = true
                            isImmutablePojos = true
                            isFluentSetters = true
                        }
                        target.apply {
                            packageName = "app.recipier.db"
                        }
                    }
                }
            }
        }
    }
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

    val generateJooq by getting {
        dependsOn("flywayMigrate")
    }
}