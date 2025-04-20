"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Check, GraduationCap, Mail, Phone, User, MapPin, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUserById, updateUser } from "@/lib/user-service"
import { getEnrollmentsForStudent } from "@/lib/course-service"

export default function ProfilePage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [userData, setUserData] = useState<any>(null)
  const [enrollmentData, setEnrollmentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    emergency_contact: "",
    date_of_birth: "",
    gender: "",
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
      fetchEnrollmentData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const user = await getUserById(session!.user.id)
      setUserData(user)
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
        phone_number: user?.phone_number || "",
        address: user?.address || "",
        emergency_contact: user?.emergency_contact || "",
        date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth).toISOString().split("T")[0] : "",
        gender: user?.gender || "",
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollmentData = async () => {
    try {
      const enrollments = await getEnrollmentsForStudent(session!.user.id)

      // Calculate credits
      const completedCredits = enrollments
        .filter((e) => e.status === "completed" && e.grade && e.grade !== "F")
        .reduce((sum, e) => sum + (e.credits || 0), 0)

      const inProgressCredits = enrollments
        .filter((e) => e.status === "enrolled")
        .reduce((sum, e) => sum + (e.credits || 0), 0)

      setEnrollmentData({
        enrollments,
        credits: {
          completed: completedCredits,
          inProgress: inProgressCredits,
          required: 120, // This could be fetched from a program requirements table
        },
      })
    } catch (error) {
      console.error("Error fetching enrollment data:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSave = async () => {
    try {
      const updatedUser = await updateUser(session!.user.id, {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        address: formData.address,
        emergency_contact: formData.emergency_contact,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
      })

      if (updatedUser) {
        setUserData(updatedUser)
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    }
  }

  // Get completion percentage for the progress bar
  const completionPercentage = enrollmentData
    ? ((enrollmentData.credits.completed + enrollmentData.credits.inProgress) / enrollmentData.credits.required) * 100
    : 0

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">View and manage your student profile</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Personal Information</TabsTrigger>
          <TabsTrigger value="academic">Academic Information</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_250px]">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">{userData?.name}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">{userData?.email}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">
                      {userData?.phone_number || "Not provided"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  {isEditing ? (
                    <Textarea id="address" name="address" value={formData.address} onChange={handleChange} />
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">
                      {userData?.address || "Not provided"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  {isEditing ? (
                    <Input
                      id="emergency_contact"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">
                      {userData?.emergency_contact || "Not provided"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">
                      {userData?.date_of_birth ? new Date(userData.date_of_birth).toLocaleDateString() : "Not provided"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="rounded-md border border-transparent px-3 py-2 text-sm">
                      {userData?.gender
                        ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)
                        : "Not provided"}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t px-6 py-4">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Your profile picture and avatar</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage
                    src={userData?.profile_picture_url || "/placeholder.svg?height=128&width=128"}
                    alt={userData?.name}
                  />
                  <AvatarFallback>
                    {userData?.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="w-full" size="sm">
                  Change Picture
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_250px]">
            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>View your academic details and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Student ID</p>
                      <p className="text-sm text-muted-foreground">{userData?.student_id || "Not assigned"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-sm text-muted-foreground">{userData?.branch || "Not assigned"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Expected Graduation</p>
                      <p className="text-sm text-muted-foreground">{userData?.graduating_year || "Not assigned"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Academic Email</p>
                      <p className="text-sm text-muted-foreground">{userData?.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contact Number</p>
                      <p className="text-sm text-muted-foreground">{userData?.phone_number || "Not provided"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{userData?.address || "Not provided"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Date of Birth</p>
                      <p className="text-sm text-muted-foreground">
                        {userData?.date_of_birth
                          ? new Date(userData.date_of_birth).toLocaleDateString()
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credit Summary</CardTitle>
                <CardDescription>Your progress towards graduation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrollmentData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Completed</p>
                      <Badge variant="outline">{enrollmentData.credits.completed}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">In Progress</p>
                      <Badge variant="outline">{enrollmentData.credits.inProgress}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Required</p>
                      <Badge variant="outline">{enrollmentData.credits.required}</Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <p className="font-medium">Completion</p>
                        <p>{completionPercentage.toFixed(0)}%</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${completionPercentage}%` }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">No enrollment data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

