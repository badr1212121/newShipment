package com.example.shipment.shipment;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<MessageDto.MessageResponse> createMessage(@Valid @RequestBody MessageDto.SendMessageRequest request) {
        User currentUser = getCurrentUser();
        MessageDto.MessageResponse response = messageService.sendMessage(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<MessageDto.ConversationPreview>> getInbox() {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(messageService.getInbox(currentUser.getId()));
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<MessageDto.MessageResponse>> getConversation(@PathVariable Long otherUserId) {
        User currentUser = getCurrentUser();
        return ResponseEntity.ok(messageService.getConversation(currentUser.getId(), otherUserId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<MessageDto.UnreadCountResponse> getUnreadCount() {
        User currentUser = getCurrentUser();
        long count = messageService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(MessageDto.UnreadCountResponse.builder().count(count).build());
    }

    @GetMapping("/receivers")
    public ResponseEntity<List<MessageDto.UserSummary>> getReceivers() {
        User currentUser = getCurrentUser();
        String role = currentUser.getRole() != null ? currentUser.getRole().name() : null;
        return ResponseEntity.ok(messageService.getAvailableReceivers(currentUser.getId(), role));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<MessageDto.MessageResponse> markAsRead(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        MessageDto.MessageResponse response = messageService.markAsRead(id, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        messageService.deleteMessage(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            throw new jakarta.persistence.EntityNotFoundException("User not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("User not found"));
    }
}
