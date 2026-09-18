package com.example.shipment.shipment;

import com.example.shipment.shipment.DriverDto.*;
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
 * Unit tests for DriverService.
 *
 * These are pure unit tests: no Spring, no database. The repositories that
 * DriverService depends on are replaced with Mockito "mocks" (fakes we control),
 * so each test runs in milliseconds and checks ONLY the service's own logic.
 *
 * @ExtendWith(MockitoExtension.class) turns on Mockito for this class, so the
 * @Mock and @InjectMocks annotations below get wired up automatically.
 */
@ExtendWith(MockitoExtension.class)
class DriverServiceTest {

    // @Mock = a fake DriverRepository. It does nothing until we tell it to.
    @Mock
    private DriverRepository driverRepository;

    @Mock
    private UserRepository userRepository;

    // @InjectMocks = create a real DriverService and inject the two mocks above
    // into its constructor. This is the actual object under test.
    @InjectMocks
    private DriverService driverService;

    @Test
    void updateGps_savesCoordinates_whenDriverExists() {
        // --- Arrange: set up a fake driver and script the mock ---
        // A real driver always has a linked user; toResponse() reads user.getId(),
        // so we must set one here or we'd hit a NullPointerException.
        User user = User.builder().id(7L).username("driver7").build();
        Driver driver = Driver.builder().id(1L).fullName("Test Driver").user(user).build();
        // When the service calls findById(1L), the fake repo returns our driver.
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
        // When it calls save(...), just return whatever it was given.
        when(driverRepository.save(any(Driver.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateGpsRequest request = UpdateGpsRequest.builder()
                .latitude(33.5731)
                .longitude(-7.5898)
                .build();

        // --- Act: call the real method we want to test ---
        DriverResponse response = driverService.updateGps(1L, request);

        // --- Assert: verify it did the right thing ---
        assertEquals(33.5731, response.getLatitude());
        assertEquals(-7.5898, response.getLongitude());
        assertNotNull(response.getLocationUpdatedAt(), "should stamp the update time");
        // verify() checks the service actually asked the repo to save.
        verify(driverRepository).save(driver);
    }

    @Test
    void updateGps_throws_whenDriverNotFound() {
        // Arrange: the fake repo finds nothing for id 99.
        when(driverRepository.findById(99L)).thenReturn(Optional.empty());
        UpdateGpsRequest request = UpdateGpsRequest.builder().latitude(1.0).longitude(2.0).build();

        // Act + Assert: calling the method should throw EntityNotFoundException.
        assertThrows(EntityNotFoundException.class,
                () -> driverService.updateGps(99L, request));

        // And it should never try to save anything.
        verify(driverRepository, never()).save(any());
    }

    @Test
    void create_throws_whenUserAlreadyHasDriver() {
        // Arrange: the user exists...
        User user = User.builder().id(5L).username("bob").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        // ...but a driver profile already exists for that user.
        when(driverRepository.findByUser_Id(5L))
                .thenReturn(Optional.of(Driver.builder().id(1L).build()));

        CreateRequest request = CreateRequest.builder()
                .userId(5L)
                .fullName("Bob Driver")
                .build();

        // Act + Assert: the service should reject the duplicate.
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> driverService.create(request));
        assertEquals("Driver already exists for this user", ex.getMessage());
    }

    @Test
    void create_savesNewDriver_whenValid() {
        // Arrange: user exists and has no driver yet.
        User user = User.builder().id(5L).username("bob").build();
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(driverRepository.findByUser_Id(5L)).thenReturn(Optional.empty());
        when(driverRepository.save(any(Driver.class))).thenAnswer(inv -> {
            Driver d = inv.getArgument(0);
            d.setId(10L); // pretend the DB assigned an id
            return d;
        });

        CreateRequest request = CreateRequest.builder()
                .userId(5L)
                .fullName("Bob Driver")
                .build();

        // Act
        DriverResponse response = driverService.create(request);

        // Assert
        assertEquals(10L, response.getId());
        assertEquals("Bob Driver", response.getFullName());
        assertEquals(5L, response.getUserId());
        assertEquals(DriverStatus.AVAILABLE, response.getStatus(), "defaults to AVAILABLE");
    }

    @Test
    void findById_throws_whenMissing() {
        when(driverRepository.findById(42L)).thenReturn(Optional.empty());
        assertThrows(EntityNotFoundException.class, () -> driverService.findById(42L));
    }
}
