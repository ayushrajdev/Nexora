import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "@/App";
import { apiClient } from "@/lib/api-client";
import { UserProfile } from "@/types";

vi.mock("@/lib/socket-client", () => ({
  createSocketConnection: vi.fn(() => ({
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

const mockAuthenticatedUser: UserProfile = {
  _id: "auth-user-1",
  firstName: "Ada",
  lastName: "Lovelace",
  emailId: "ada@devtinder.io",
  age: 28,
  gender: "female",
  photoUrl: "https://example.com/ada.png",
  about: "First computer programmer.",
  skills: ["TypeScript", "React", "Node.js"],
  isPremium: false,
  membershipType: null,
};

describe("Pages & Backend API Integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders HomePage for unauthenticated users and navigates to LoginPage", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Unauthorized"));

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Swipe Right on Your Next/i)
    ).toBeInTheDocument();

    const signInBtn = screen.getByRole("button", {
      name: /Sign In to Account/i,
    });
    fireEvent.click(signInBtn);

    await waitFor(() => {
      expect(screen.getByText("Welcome Back, Builder")).toBeInTheDocument();
    });
  });

  it("authenticates user via POST /auth/login and redirects to Discovery Feed", async () => {
    // Initial profile check returns 401
    const getSpy = vi
      .spyOn(apiClient, "get")
      .mockRejectedValueOnce(new Error("Unauthorized"))
      .mockResolvedValueOnce({
        data: {
          success: true,
          message: "Feed retrieved",
          data: [
            {
              _id: "candidate-1",
              firstName: "Grace",
              lastName: "Hopper",
              photoUrl: "https://example.com/grace.png",
              about: "COBOL pioneer & compiler architect",
              skills: ["Rust", "Go", "System Design"],
            },
          ],
        },
      });

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        success: true,
        message: "Login successful",
        data: { user: mockAuthenticatedUser },
      },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Welcome Back, Builder")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "ada@devtinder.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign In$/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/auth/login", {
        emailId: "ada@devtinder.io",
        password: "Password@123",
      });
      expect(screen.getByText("Discover Developers")).toBeInTheDocument();
      expect(screen.getByText("Grace Hopper")).toBeInTheDocument();
    });

    expect(getSpy).toHaveBeenCalledWith("/user/feed", {
      params: { page: 1, limit: 15 },
    });
  });

  it("registers new user via POST /auth/signup and redirects to ProfilePage", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Unauthorized"));

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        success: true,
        message: "Signup successful",
        data: { user: mockAuthenticatedUser },
      },
    });

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Create Your Dev Profile")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Ada" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: { value: "ada@devtinder.io" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/auth/signup", {
        firstName: "Ada",
        lastName: "Lovelace",
        emailId: "ada@devtinder.io",
        password: "Password@123",
      });
      expect(screen.getByText("Developer Profile Studio")).toBeInTheDocument();
    });
  });

  it("renders ProfilePage and updates profile via PATCH /profile/edit", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      data: {
        success: true,
        message: "Profile fetched",
        data: mockAuthenticatedUser,
      },
    });

    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      data: {
        success: true,
        message: "Profile updated",
        data: {
          ...mockAuthenticatedUser,
          about: "Updated bio from React Vite app",
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Developer Profile Studio")).toBeInTheDocument();
    });

    const bioInput = screen.getByLabelText("About / Builder Bio");
    fireEvent.change(bioInput, {
      target: { value: "Updated bio from React Vite app" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /Save Profile Changes/i })
    );

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith(
        "/profile/edit",
        expect.objectContaining({
          firstName: "Ada",
          about: "Updated bio from React Vite app",
        })
      );
      expect(screen.getByText("Profile Saved!")).toBeInTheDocument();
    });
  });

  it("renders ConnectionsPage with search filter via GET /user/connections", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url === "/profile/view") {
        return Promise.resolve({
          data: { success: true, data: mockAuthenticatedUser },
        });
      }
      if (url === "/user/connections") {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                _id: "conn-1",
                fromUserId: mockAuthenticatedUser._id,
                toUserId: "dev-rust",
                status: "accepted",
                user: {
                  _id: "dev-rust",
                  firstName: "Graydon",
                  lastName: "Hoare",
                  photoUrl: "",
                  about: "Rust creator",
                  skills: ["Rust", "C++"],
                },
              },
              {
                _id: "conn-2",
                fromUserId: mockAuthenticatedUser._id,
                toUserId: "dev-go",
                status: "accepted",
                user: {
                  _id: "dev-go",
                  firstName: "Rob",
                  lastName: "Pike",
                  photoUrl: "",
                  about: "Go co-creator",
                  skills: ["Go", "Plan9"],
                },
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
      <MemoryRouter initialEntries={["/connections"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Graydon Hoare")).toBeInTheDocument();
      expect(screen.getByText("Rob Pike")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search by name, skill, or bio..."
    );
    fireEvent.change(searchInput, { target: { value: "Rust" } });

    expect(screen.getByText("Graydon Hoare")).toBeInTheDocument();
    expect(screen.queryByText("Rob Pike")).not.toBeInTheDocument();
  });

  it("renders RequestsPage and reviews request via POST /request/review/accepted/:requestId", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url === "/profile/view") {
        return Promise.resolve({
          data: { success: true, data: mockAuthenticatedUser },
        });
      }
      if (url === "/user/requests/received") {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                _id: "req-101",
                fromUserId: "dev-sender",
                toUserId: mockAuthenticatedUser._id,
                status: "interested",
                fromUser: {
                  _id: "dev-sender",
                  firstName: "Anders",
                  lastName: "Hejlsberg",
                  photoUrl: "",
                  about: "TypeScript lead architect",
                  skills: ["TypeScript", "C#"],
                },
              },
            ],
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          _id: "req-101",
          fromUserId: "dev-sender",
          toUserId: mockAuthenticatedUser._id,
          status: "accepted",
        },
      },
    });

    render(
      <MemoryRouter initialEntries={["/requests"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Anders Hejlsberg")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Accept/i }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        "/request/review/accepted/req-101"
      );
      expect(screen.getByText("Connected with Anders!")).toBeInTheDocument();
    });
  });

  it("renders PremiumPage and verifies membership via GET /payment/premium/verify", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url === "/profile/view") {
        return Promise.resolve({
          data: { success: true, data: mockAuthenticatedUser },
        });
      }
      if (url === "/payment/premium/verify") {
        return Promise.resolve({
          data: {
            success: true,
            data: { isPremium: true, membershipType: "gold" },
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
      <MemoryRouter initialEntries={["/premium"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText("Supercharge Your Developer Network")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Verify Status/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Active GOLD Membership!")
      ).toBeInTheDocument();
    });
  });

  it("loads ChatRoomPage history via GET /chat/:targetUserId and sends message via Socket.IO", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url: string) => {
      if (url === "/profile/view") {
        return Promise.resolve({
          data: { success: true, data: mockAuthenticatedUser },
        });
      }
      if (url === "/user/connections") {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                _id: "conn-99",
                fromUserId: mockAuthenticatedUser._id,
                toUserId: "dev-2",
                status: "accepted",
                user: {
                  _id: "dev-2",
                  firstName: "Ken",
                  lastName: "Thompson",
                  photoUrl: "",
                  about: "Unix creator",
                  skills: ["Go", "C"],
                },
              },
            ],
          },
        });
      }
      if (url === "/chat/dev-2") {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              _id: "chat-1",
              participants: [mockAuthenticatedUser._id, "dev-2"],
              messages: [
                {
                  _id: "msg-1",
                  senderId: "dev-2",
                  firstName: "Ken",
                  text: "Hello from Unix!",
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          },
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    render(
      <MemoryRouter initialEntries={["/chat/dev-2"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Hello from Unix!")).toBeInTheDocument();
    });

    const msgInput = screen.getByPlaceholderText("Write a message...");
    fireEvent.change(msgInput, { target: { value: "Hey Ken, let's build!" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(msgInput).toHaveValue("");
  });
});
