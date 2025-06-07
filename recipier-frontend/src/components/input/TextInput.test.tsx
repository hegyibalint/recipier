import { describe, it, expect, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent, page } from "@vitest/browser/context";
import TextInput from "./TextInput";

describe("TextInput", () => {
  it("renders input with placeholder", async () => {
    const mockOnChange = vi.fn();
    
    const screen = render(
      <TextInput
        placeholder="Enter text"
        onChange={mockOnChange}
      />
    );
    
    const input = screen.getByPlaceholder("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("renders label when provided", async () => {
    const mockOnChange = vi.fn();
    
    const screen = render(
      <TextInput
        label="Test Label"
        onChange={mockOnChange}
      />
    );
    
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("displays value when provided", async () => {
    const mockOnChange = vi.fn();
    
    render(
      <TextInput
        value="test value"
        onChange={mockOnChange}
      />
    );
    
    const input = page.getByRole("textbox");
    expect(input).toHaveValue("test value");
  });

  it("calls onChange when user types", async () => {
    const mockOnChange = vi.fn();
    
    render(
      <TextInput
        onChange={mockOnChange}
      />
    );
    
    const input = page.getByRole("textbox");
    await userEvent.type(input, "hello");
    
    expect(mockOnChange).toHaveBeenCalledWith("h");
    expect(mockOnChange).toHaveBeenCalledWith("he");
    expect(mockOnChange).toHaveBeenCalledWith("hel");
    expect(mockOnChange).toHaveBeenCalledWith("hell");
    expect(mockOnChange).toHaveBeenCalledWith("hello");
  });

  it("applies custom className", async () => {
    const mockOnChange = vi.fn();
    
    render(
      <TextInput
        className="custom-class"
        onChange={mockOnChange}
      />
    );
    
    const input = page.getByRole("textbox");
    expect(input).toHaveClass("custom-class");
  });

  it("handles empty value", async () => {
    const mockOnChange = vi.fn();
    
    render(
      <TextInput
        value=""
        onChange={mockOnChange}
      />
    );
    
    const input = page.getByRole("textbox");
    expect(input).toHaveValue("");
  });
});