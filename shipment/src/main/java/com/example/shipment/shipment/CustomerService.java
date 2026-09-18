package com.example.shipment.shipment;

import com.example.shipment.shipment.CustomerDto.CustomerResponse;
import com.example.shipment.shipment.CustomerDto.CreateRequest;
import com.example.shipment.shipment.CustomerDto.UpdateRequest;
import jakarta.persistence.EntityNotFoundException;
import com.example.shipment.shipment.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;

    public List<CustomerResponse> findAll() {
        return customerRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomerResponse findById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found: " + id));
        return toResponse(customer);
    }

    public CustomerResponse findByUserId(Long userId) {
        Customer customer = customerRepository.findByUser_Id(userId)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found for user: " + userId));
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse create(CreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        if (customerRepository.findByUser_Id(request.getUserId()).isPresent()) {
            throw new IllegalArgumentException("Customer already exists for this user");
        }
        Customer customer = Customer.builder()
                .user(user)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .build();
        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse update(Long id, UpdateRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Customer not found: " + id));
        if (request.getFullName() != null) {
            customer.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            customer.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            customer.setAddress(request.getAddress());
        }
        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    @Transactional
    public void delete(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new EntityNotFoundException("Customer not found: " + id);
        }
        customerRepository.deleteById(id);
    }

    private CustomerResponse toResponse(Customer customer) {
        return CustomerResponse.builder()
                .id(customer.getId())
                .userId(customer.getUser().getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .email(customer.getUser().getEmail())
                .shipmentsCount(shipmentRepository.countByCustomer_Id(customer.getId()))
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
