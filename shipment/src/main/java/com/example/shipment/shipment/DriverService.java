package com.example.shipment.shipment;

import com.example.shipment.shipment.DriverDto.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;

    public List<DriverResponse> findAll() {
        return driverRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public DriverResponse findById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Driver not found: " + id));
        return toResponse(driver);
    }

    public List<DriverResponse> findAvailable() {
        return driverRepository.findByStatus(DriverStatus.AVAILABLE).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DriverResponse create(CreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        if (driverRepository.findByUser_Id(request.getUserId()).isPresent()) {
            throw new IllegalArgumentException("Driver already exists for this user");
        }
        DriverStatus status = request.getStatus() != null ? request.getStatus() : DriverStatus.AVAILABLE;
        Driver driver = Driver.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .licenseNumber(request.getLicenseNumber())
                .currentLocation(request.getCurrentLocation())
                .status(status)
                .build();
        driver = driverRepository.save(driver);
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse update(Long id, UpdateRequest request) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Driver not found: " + id));
        if (request.getFullName() != null) {
            driver.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            driver.setPhone(request.getPhone());
        }
        if (request.getLicenseNumber() != null) {
            driver.setLicenseNumber(request.getLicenseNumber());
        }
        if (request.getCurrentLocation() != null) {
            driver.setCurrentLocation(request.getCurrentLocation());
        }
        if (request.getStatus() != null) {
            driver.setStatus(request.getStatus());
        }
        driver = driverRepository.save(driver);
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse updateLocation(Long id, UpdateLocationRequest request) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Driver not found: " + id));
        driver.setCurrentLocation(request.getCurrentLocation());
        driver = driverRepository.save(driver);
        return toResponse(driver);
    }

    @Transactional
    public DriverResponse updateGps(Long id, UpdateGpsRequest request) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Driver not found: " + id));
        driver.setLatitude(request.getLatitude());
        driver.setLongitude(request.getLongitude());
        driver.setLocationUpdatedAt(java.time.LocalDateTime.now());
        driver = driverRepository.save(driver);
        log.info("Driver {} GPS updated: {}, {}", id, request.getLatitude(), request.getLongitude());
        return toResponse(driver);
    }

    @Transactional
    public void delete(Long id) {
        if (!driverRepository.existsById(id)) {
            throw new EntityNotFoundException("Driver not found: " + id);
        }
        driverRepository.deleteById(id);
    }

    private DriverResponse toResponse(Driver driver) {
        return DriverResponse.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .fullName(driver.getFullName())
                .phone(driver.getPhone())
                .licenseNumber(driver.getLicenseNumber())
                .currentLocation(driver.getCurrentLocation())
                .latitude(driver.getLatitude())
                .longitude(driver.getLongitude())
                .locationUpdatedAt(driver.getLocationUpdatedAt())
                .status(driver.getStatus())
                .createdAt(driver.getCreatedAt())
                .build();
    }
}
