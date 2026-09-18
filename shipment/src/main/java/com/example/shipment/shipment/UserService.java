package com.example.shipment.shipment;

import com.example.shipment.shipment.UserDto.UpdateRoleRequest;
import com.example.shipment.shipment.UserDto.UserResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final CustomerRepository customerRepository;
    private final ShipmentRepository shipmentRepository;

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UserResponse updateRole(Long id, UpdateRoleRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        user.setRole(request.getRole());
        user = userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        driverRepository.findByUser_Id(id).ifPresent(driver -> {
            shipmentRepository.findByDriver_Id(driver.getId()).forEach(s -> {
                s.setDriver(null);
                s.setAssignedAt(null);
                shipmentRepository.save(s);
            });
            driverRepository.delete(driver);
        });

        customerRepository.findByUser_Id(id).ifPresent(customer -> {
            shipmentRepository.findByCustomer_Id(customer.getId()).forEach(s -> {
                s.setCustomer(null);
                shipmentRepository.save(s);
            });
            customerRepository.delete(customer);
        });

        userRepository.delete(user);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
