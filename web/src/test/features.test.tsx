import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import { DeveloperCard } from "@/components/features/feed/DeveloperCard";
import { ConnectionCard } from "@/components/features/connections/ConnectionCard";
import { RequestCard } from "@/components/features/connections/RequestCard";
import { PasswordChangeModal } from "@/components/features/profile/PasswordChangeModal";
import { ToastProvider } from "@/context/ToastContext";
import { profileService } from "@/services/profile.service";
import {
  ConnectionItem,
  ReceivedConnectionRequest,
  UserProfile,
} from "@/types";

const mockUser: UserProfile = {
  _id: "user-123",
  firstName: "Linus",
  lastName: "Torvalds",
  age: 54,
  gender: "male",
  photoUrl: "https://example.com/linus.png",
  about: "Creator of Linux and Git.",
  skills: ["C", "Linux", "Git", "Kernel"],
  isPremium: true,
  membershipType: "gold",
};

describe("Feature Components", () => {
  describe("DeveloperCard", () => {
    it("renders developer details, skills, and premium badge", () => {
      render(<DeveloperCard profile={mockUser} />);
      expect(screen.getByText("Linus Torvalds")).toBeInTheDocument();
      expect(screen.getByText("54")).toBeInTheDocument();
      expect(screen.getByText("Creator of Linux and Git.")).toBeInTheDocument();
      expect(screen.getByText("Linux")).toBeInTheDocument();
      expect(screen.getByText("GOLD")).toBeInTheDocument();
    });

    it("triggers onSwipe callback when interested or ignored buttons are clicked", async () => {
      const onSwipe = vi.fn();
      render(<DeveloperCard profile={mockUser} onSwipe={onSwipe} />);

      const interestedBtn = screen.getByRole("button", {
        name: /send interest/i,
      });
      fireEvent.click(interestedBtn);

      await waitFor(() => {
        expect(onSwipe).toHaveBeenCalledWith("interested", mockUser);
      });
    });

    it("hides action buttons in preview mode", () => {
      render(<DeveloperCard profile={mockUser} isPreview />);
      expect(screen.getByText("Live Card Preview")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /send interest/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("ConnectionCard", () => {
    it("renders matched developer info and link to real-time chat room", () => {
      const connection: ConnectionItem = {
        _id: "conn-1",
        fromUserId: "me",
        toUserId: mockUser._id,
        status: "accepted",
        user: mockUser,
      };

      render(
        <MemoryRouter>
          <ConnectionCard connection={connection} />
        </MemoryRouter>
      );

      expect(screen.getByText("Linus Torvalds")).toBeInTheDocument();
      expect(screen.getByText("PRO")).toBeInTheDocument();
      const chatLink = screen.getByRole("link");
      expect(chatLink).toHaveAttribute("href", "/chat/user-123");
    });
  });

  describe("RequestCard", () => {
    it("renders incoming request and calls onReview for accept and ignore", () => {
      const onReview = vi.fn().mockResolvedValue(undefined);
      const request: ReceivedConnectionRequest = {
        _id: "req-1",
        fromUserId: mockUser._id,
        toUserId: "me",
        status: "interested",
        fromUser: mockUser,
      };

      render(
        <RequestCard
          request={request}
          onReview={onReview}
          isProcessing={false}
        />
      );

      expect(screen.getByText("Linus Torvalds")).toBeInTheDocument();
      expect(screen.getByText("Wants to connect")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /accept/i }));
      expect(onReview).toHaveBeenCalledWith("accepted", request);

      fireEvent.click(screen.getByRole("button", { name: /ignore/i }));
      expect(onReview).toHaveBeenCalledWith("rejected", request);
    });
  });

  describe("PasswordChangeModal", () => {
    it("validates password length and confirmation match before calling service", async () => {
      const onClose = vi.fn();
      const spy = vi
        .spyOn(profileService, "changePassword")
        .mockResolvedValue("Password updated");

      render(
        <ToastProvider>
          <PasswordChangeModal isOpen={true} onClose={onClose} />
        </ToastProvider>
      );

      fireEvent.change(screen.getByLabelText("Current Password"), {
        target: { value: "OldPass@123" },
      });
      fireEvent.change(screen.getByLabelText("New Strong Password"), {
        target: { value: "short" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password"), {
        target: { value: "short" },
      });

      fireEvent.click(screen.getByRole("button", { name: /update password/i }));
      expect(
        screen.getByText("New password must be at least 8 characters long.")
      ).toBeInTheDocument();

      // Test mismatch
      fireEvent.change(screen.getByLabelText("New Strong Password"), {
        target: { value: "NewPass@1234" },
      });
      fireEvent.change(screen.getByLabelText("Confirm New Password"), {
        target: { value: "Different@1234" },
      });
      fireEvent.click(screen.getByRole("button", { name: /update password/i }));
      expect(
        screen.getByText("New passwords do not match.")
      ).toBeInTheDocument();

      // Test valid submission
      fireEvent.change(screen.getByLabelText("Confirm New Password"), {
        target: { value: "NewPass@1234" },
      });
      fireEvent.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(spy).toHaveBeenCalledWith({
          oldPassword: "OldPass@123",
          newPassword: "NewPass@1234",
        });
        expect(onClose).toHaveBeenCalled();
      });

      spy.mockRestore();
    });
  });
});
