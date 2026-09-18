# --- Build stage: compile the app with Maven ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
# Copy the build descriptor first so dependency downloads are cached
COPY pom.xml .
RUN mvn -B dependency:go-offline
# Copy the source and build the jar (skip tests here; CI runs them separately)
COPY src ./src
RUN mvn -B clean package -DskipTests

# --- Run stage: small image with just the JRE + the built jar ---
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
