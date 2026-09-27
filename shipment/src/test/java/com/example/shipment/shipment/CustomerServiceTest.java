package com.example.shipment.shipment;

import com.example.shipment.shipment.CustomerDto.CreateRequest;
import com.example.shipment.shipment.CustomerDto.CustomerResponse;
import com.example.shipment.shipment.CustomerDto.UpdateRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CustomerService.
 *
 * Pure logic over three mocked repositories — no database, no external calls.
 * Covers the create/find/update/delete logic and its main failure paths.
 */
@ExtendWith(MockitoExtension.class)
class CustomerServiceTest {

    @Mock private CustomerRepository customerRepository;
    @Mock private UserRepository userRepository;
    @Mock private ShipmentRepository shipmentRepository;

    @InjectMocks private CustomerService customerService;

    // Helper: a customer with a linked user, as a real one always has
    // (toResponse reads customer.getUser().getId()/getEmail()).
    private Customer customerWithUser(Long id) {
        User user = User.builder().id(7L).email("c@test.com").build();
        return Customer.builder().id(id).user(user).fullName("Client One").build();
    }

    @Test
    void create_savesNewCustomer_whenValid() {
        // Arrange: user exists, no customer yet
        User user = User.builder().id(7L).email("c@test.com").build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUser_Id(7L)).thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> {
            Customer c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });
        // toResponse calls this — stub it so it doesn't NPE
        when(shipmentRepository.countByCustomer_Id(10L)).thenReturn(0L);

        CreateRequest request = CreateRequest.builder()
                .userId(7L).fullName("Client One").phone("0600").address("Rabat").build();

        // Act
        CustomerResponse response = customerService.create(request);

        // Assert
        assertEquals(10L, response.getId());
        assertEquals("Client One", response.getFullName());
        assertEquals(7L, response.getUserId());
        assertEquals("c@test.com", response.getEmail());
    }

    @Test
    void create_throws_whenUserNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        CreateRequest request = CreateRequest.builder().userId(99L).fullName("X").build();

        assertThrows(EntityNotFoundException.class, () -> customerService.create(request));
        verify(customerRepository, never()).save(any());
    }

    @Test
    void create_throws_whenCustomerAlreadyExistsForUser() {
        User user = User.builder().id(7L).build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(customerRepository.findByUser_Id(7L)).thenReturn(Optional.of(new Customer()));

        CreateRequest request = CreateRequest.builder().userId(7L).fullName("X").build();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> customerService.create(request));
        assertEquals("Customer already exists for this user", ex.getMessage());
    }

    @Test
    void findById_throws_whenMissing() {
        when(customerRepository.findById(42L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> customerService.findById(42L));
    }

    @Test
    void update_changesProvidedFields() {
        Customer customer = customerWithUser(1L);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(customerRepository.save(any(Customer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(shipmentRepository.countByCustomer_Id(1L)).thenReturn(3L);

        UpdateRequest request = UpdateRequest.builder()
                .fullName("New Name").phone("0700").build();  // address left null on purpose

        CustomerResponse response = customerService.update(1L, request);

        assertEquals("New Name", response.getFullName());
        assertEquals("0700", response.getPhone());
        assertEquals(3L, response.getShipmentsCount());
    }

    @Test
    void delete_throws_whenMissing() {
        when(customerRepository.existsById(99L)).thenReturn(false);
        assertThrows(EntityNotFoundException.class, () -> customerService.delete(99L));
        verify(customerRepository, never()).deleteById(any());
    }
}
