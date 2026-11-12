import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Input, Textarea } from "@/components/ui/Input";

describe("UI Components", () => {
  describe("Button", () => {
    it("renders button text and handles click", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole("button", { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("disables button when isLoading is true", () => {
      render(<Button isLoading>Submitting</Button>);
      const btn = screen.getByRole("button", { name: /submitting/i });
      expect(btn).toBeDisabled();
    });
  });

  describe("Badge", () => {
    it("renders children with gold variant styling", () => {
      render(<Badge variant="gold">PRO</Badge>);
      const badge = screen.getByText("PRO");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("amber");
    });
  });

  describe("Avatar", () => {
    it("renders fallback initials when no src is provided or image errors", () => {
      render(<Avatar firstName="Satya" lastName="Nadella" isPremium />);
      expect(screen.getByText("SN")).toBeInTheDocument();
    });

    it("renders image when src is provided and falls back on error", () => {
      render(
        <Avatar
          src="https://example.com/avatar.png"
          firstName="Ada"
          lastName="Lovelace"
        />
      );
      const img = screen.getByRole("img", { name: "Ada" });
      expect(img).toBeInTheDocument();
      fireEvent.error(img);
      expect(screen.getByText("AL")).toBeInTheDocument();
    });
  });

  describe("Input & Textarea", () => {
    it("renders Input with label, helperText, and error state", () => {
      const { rerender } = render(
        <Input label="Email Address" helperText="Enter your work email" />
      );
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByText("Enter your work email")).toBeInTheDocument();

      rerender(<Input label="Email Address" error="Invalid email" />);
      expect(screen.getByText("Invalid email")).toBeInTheDocument();
    });

    it("renders Textarea with label and handles change", () => {
      const handleChange = vi.fn();
      render(<Textarea label="Builder Bio" onChange={handleChange} />);
      const textarea = screen.getByLabelText("Builder Bio");
      fireEvent.change(textarea, { target: { value: "Rust developer" } });
      expect(handleChange).toHaveBeenCalled();
    });
  });
});
