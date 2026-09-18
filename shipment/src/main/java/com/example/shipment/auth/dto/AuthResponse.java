package com.example.shipment.auth.dto;

import com.example.shipment.shipment.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String token;
    private String username;
    private Role role;
    /** Set when registering; used to link driver/customer to new user */
    private Long userId;
}
