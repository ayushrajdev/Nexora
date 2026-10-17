"use client";

import React, { useEffect, useState } from "react";
import {
  UserCircle,
  Save,
  KeyRound,
  Plus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { DeveloperCard } from "@/components/features/feed/DeveloperCard";
import { PasswordChangeModal } from "@/components/features/profile/PasswordChangeModal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { profileService } from "@/services/profile.service";
import { normalizeApiError } from "@/lib/api-client";
import { APP_CONFIG } from "@/config/env";
import { POPULAR_DEV_SKILLS } from "@/config/routes";
import { Gender, UserProfile } from "@/types";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<Gender | "">("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Hydrate form state when user profile loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAge(user.age ? String(user.age) : "");
      setGender(user.gender || "");
      setPhotoUrl(user.photoUrl || "");
      setAbout(user.about || "");
      setSkills(user.skills || []);
    }
  }, [user]);

  const addSkill = (skillToAdd: string) => {
    const cleaned = skillToAdd.trim();
    if (!cleaned) return;
    if (skills.length >= APP_CONFIG.MAX_SKILLS) {
      toast({
        title: `Maximum ${APP_CONFIG.MAX_SKILLS} skills allowed`,
        description: "Remove an existing skill before adding a new one.",
        variant: "error",
      });
      return;
    }
    if (skills.some((s) => s.toLowerCase() === cleaned.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setSkills((prev) => [...prev, cleaned]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const parsedAge = age ? parseInt(age, 10) : undefined;
      const updated = await profileService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        age: parsedAge && !isNaN(parsedAge) ? parsedAge : undefined,
        gender: (gender as Gender) || undefined,
        photoUrl: photoUrl.trim() || undefined,
        about: about.trim(),
        skills,
      });

      setUser(updated);
      toast({
        title: "Profile Saved!",
        description: "Your developer card has been updated across DevTinder.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Failed to update profile",
        description: normalizeApiError(err).message,
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewProfile: UserProfile = {
    _id: user?._id || "preview",
    firstName: firstName || "Developer",
    lastName: lastName || undefined,
    age: age ? parseInt(age, 10) : undefined,
    gender: (gender as Gender) || undefined,
    photoUrl: photoUrl || APP_CONFIG.DEFAULT_AVATAR,
    about: about || "Tell other developers what you're building!",
    skills,
    isPremium: user?.isPremium,
    membershipType: user?.membershipType,
  };

  return (
    <AuthGuard>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <UserCircle className="h-6 w-6 text-brand-500" />
              <span>Developer Profile Studio</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Customize your bio and tech stack — preview your swipe card in real time
            </p>
          </div>

          {!user?.oauthProvider && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPasswordModalOpen(true)}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Change Password
            </Button>
          )}
        </div>

        {/* Split-Screen Editor + Live Preview */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left Form */}
          <form
            onSubmit={handleSaveProfile}
            className="lg:col-span-7 rounded-3xl border border-slate-800/90 bg-slate-900/75 p-6 sm:p-8 space-y-5 shadow-xl"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Age"
                type="number"
                min={18}
                max={100}
                placeholder="24"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender | "")}
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Select gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <Input
              label="Avatar Photo URL"
              type="url"
              placeholder="https://avatars.githubusercontent.com/u/..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              leftIcon={<ImageIcon className="w-4 h-4" />}
            />

            <Textarea
              label="About / Builder Bio"
              rows={3}
              placeholder="Full-stack engineer passionate about distributed systems, Rust, and AI agents..."
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />

            {/* Skills Manager */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Tech Stack & Skills ({skills.length}/{APP_CONFIG.MAX_SKILLS})
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  placeholder="Add a skill (e.g. TypeScript, Go, Docker)..."
                  className="flex-1 rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addSkill(skillInput)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add
                </Button>
              </div>

              {/* Active Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="brand"
                      className="pl-3 pr-2 py-1 gap-1.5"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="rounded-full p-0.5 hover:bg-brand-500/30"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Quick Add Popular Skills */}
              <div className="pt-2">
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Quick add popular technologies:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_DEV_SKILLS.filter((s) => !skills.includes(s))
                    .slice(0, 10)
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addSkill(suggestion)}
                        className="rounded-full border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                size="lg"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>

          {/* Right Live Swipe Card Preview */}
          <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-24">
            <DeveloperCard profile={previewProfile} isPreview />
          </div>
        </div>

        <PasswordChangeModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </div>
    </AuthGuard>
  );
}
