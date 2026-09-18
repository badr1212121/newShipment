package com.example.shipment.shipment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class MessageDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendMessageRequest {
        @NotNull(message = "Receiver is required")
        private Long receiverId;

        @Size(max = 200)
        private String subject;

        @NotBlank(message = "Content is required")
        @Size(max = 1000)
        private String content;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MessageResponse {
        private Long id;
        private Long senderId;
        private String senderUsername;
        private String senderRole;
        private Long receiverId;
        private String receiverUsername;
        private String receiverRole;
        private String subject;
        private String content;
        private Boolean isRead;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConversationPreview {
        private Long otherUserId;
        private String otherUsername;
        private String otherRole;
        private String lastMessage;
        private LocalDateTime lastMessageAt;
        private int unreadCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String username;
        private String role;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UnreadCountResponse {
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NewMessageNotification {
        private Long messageId;
        private String senderUsername;
        private String senderRole;
        private String subject;
        private String preview;
        private LocalDateTime createdAt;
    }
}
