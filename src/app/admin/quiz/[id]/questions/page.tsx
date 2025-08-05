"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical,
  Search,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  X
} from "lucide-react"
import { toast } from "sonner"
import { QuestionType, DifficultyLevel } from "@prisma/client"

interface Question {
  id: string
  title: string
  content: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  explanation?: string
  difficulty: DifficultyLevel
  isActive: boolean
  order: number
  points: number
}

interface AvailableQuestion {
  id: string
  title: string
  content: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  explanation?: string
  difficulty: DifficultyLevel
  isActive: boolean
}



function SortableQuestion({
  question,
  onEdit,
  onDelete,
  onView
}: {
  question: Question
  onEdit: (question: Question) => void
  onDelete: (questionId: string) => void
  onView: (question: Question) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell>
        <div {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell className="font-medium">{question.order}</TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{question.title}</div>
          <div className="text-sm text-muted-foreground">
            {question.content}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={
          question.type === QuestionType.MULTIPLE_CHOICE ? "default" :
          question.type === QuestionType.TRUE_FALSE ? "secondary" : "outline"
        }>
          {question.type.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={
          question.difficulty === DifficultyLevel.EASY ? "default" :
          question.difficulty === DifficultyLevel.MEDIUM ? "secondary" : "destructive"
        }>
          {question.difficulty}
        </Badge>
      </TableCell>
      <TableCell>{question.points}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(question)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(question)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function QuizQuestionsPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<AvailableQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [quizTitle, setQuizTitle] = useState("")
  const [createFormData, setCreateFormData] = useState({
    title: "",
    content: "",
    type: QuestionType.MULTIPLE_CHOICE,
    options: ["", ""],
    correctAnswer: "",
    explanation: "",
    difficulty: DifficultyLevel.MEDIUM,
    points: 1.0
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Removed categories state
  // Removed fetchCategories function

  useEffect(() => {
    fetchQuiz()
    fetchQuestions()
    fetchAvailableQuestions()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}`)
      if (response.ok) {
        const data = await response.json()
        setQuizTitle(data.title)
      }
    } catch (error) {
      console.error("Failed to fetch quiz title:", error)
    }
  }

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      toast.error("Failed to fetch questions")
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableQuestions = async () => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/available-questions`)
      if (response.ok) {
        const data = await response.json()
        setAvailableQuestions(data)
      }
    } catch (error) {
      toast.error("Failed to fetch available questions")
    }
  }


  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id)
      const newIndex = questions.findIndex(q => q.id === over?.id)

      const newQuestions = arrayMove(questions, oldIndex, newIndex)
      setQuestions(newQuestions)

      // Update order in backend
      try {
        await fetch(`/api/admin/quiz/${quizId}/questions/reorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionOrders: newQuestions.map((q, index) => ({
              questionId: q.id,
              order: index + 1
            }))
          }),
        })
      } catch (error) {
        toast.error("Failed to update question order")
        fetchQuestions() // Revert to original order
      }
    }
  }

  const handleRemoveQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to remove this question from the quiz?")) return

    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/questions/${questionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId))
        toast.success("Question removed from quiz")
      } else {
        toast.error("Failed to remove question")
      }
    } catch (error) {
      toast.toast.error("Failed to remove question")
    }
  }

  const handleAddQuestions = async (questionIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionIds }),
      })

      if (response.ok) {
        toast.success("Questions added to quiz")
        setIsAddDialogOpen(false)
        fetchQuestions()
        fetchAvailableQuestions()
      } else {
        toast.error("Failed to add questions")
      }
    } catch (error) {
      toast.error("Failed to add questions")
    }
  }

  const handleCreateQuestion = async () => {
    try {
      const response = await fetch(`/api/admin/quiz/${quizId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...createFormData,
          options: createFormData.options.filter(opt => opt.trim() !== "")
        }),
      })

      if (response.ok) {
        toast.success("Question created and added to quiz")
        setIsCreateDialogOpen(false)
        setCreateFormData({
          title: "",
          content: "",
          type: QuestionType.MULTIPLE_CHOICE,
          options: ["", ""],
          correctAnswer: "",
          explanation: "",
          difficulty: DifficultyLevel.MEDIUM,
          points: 1.0
        })
        fetchQuestions()
        fetchAvailableQuestions()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create question")
      }
    } catch (error) {
      toast.error("Failed to create question")
    }
  }

  // Removed category filtering logic
  const filteredAvailableQuestions = availableQuestions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = difficultyFilter === "all" || question.difficulty === difficultyFilter

    return matchesSearch && matchesDifficulty
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Questions</h1>
          <p className="text-muted-foreground">
            Manage questions for "{quizTitle}"
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Questions
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Question
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Questions</CardTitle>
          <CardDescription>
            Drag and drop to reorder questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[80px]">Order</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  {questions.map((question) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      onEdit={(q) => {
                        setSelectedQuestion(q)
                        setIsViewDialogOpen(true)
                      }}
                      onDelete={handleRemoveQuestion}
                      onView={(q) => {
                        setSelectedQuestion(q)
                        setIsViewDialogOpen(true)
                      }}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </CardContent>
      </Card>

      {/* Add Questions Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Questions to Quiz</DialogTitle>
            <DialogDescription>
              Select questions to add to this quiz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredAvailableQuestions.map((question) => (
                <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{question.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {question.content}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={
                        question.type === QuestionType.MULTIPLE_CHOICE ? "default" :
                        question.type === QuestionType.TRUE_FALSE ? "secondary" : "outline"
                      }>
                        {question.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={
                        question.difficulty === DifficultyLevel.EASY ? "default" :
                        question.difficulty === DifficultyLevel.MEDIUM ? "secondary" : "destructive"
                      }>
                        {question.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAddQuestions([question.id])}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Question Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Question Details</DialogTitle>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Title</Label>
                <p className="text-sm text-muted-foreground">{selectedQuestion.title}</p>
              </div>
              <div>
                <Label className="font-medium">Content</Label>
                <p className="text-sm text-muted-foreground">{selectedQuestion.content}</p>
              </div>
              <div>
                <Label className="font-medium">Type</Label>
                <p className="text-sm text-muted-foreground">{selectedQuestion.type.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="font-medium">Options</Label>
                <div className="text-sm text-muted-foreground">
                  {selectedQuestion.options.map((option: string, index: number) => (
                    <div key={index}>• {option}</div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="font-medium">Correct Answer</Label>
                <p className="text-sm text-muted-foreground">{selectedQuestion.correctAnswer}</p>
              </div>
              {selectedQuestion.explanation && (
                <div>
                  <Label className="font-medium">Explanation</Label>
                  <p className="text-sm text-muted-foreground">{selectedQuestion.explanation}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Question Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
            <DialogDescription>
              Create a new question and add it to this quiz
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={createFormData.title}
                onChange={(e) => setCreateFormData({...createFormData, title: e.target.value})}
                className="col-span-3"
                placeholder="Enter question title"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                value={createFormData.content}
                onChange={(e) => setCreateFormData({...createFormData, content: e.target.value})}
                className="col-span-3"
                placeholder="Enter question content"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={createFormData.type}
                onValueChange={(value) => {
                  setCreateFormData({
                    ...createFormData,
                    type: value as QuestionType,
                    options: value === "TRUE_FALSE" ? ["True", "False"] : [""]
                  })
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                  <SelectItem value={QuestionType.TRUE_FALSE}>True/False</SelectItem>
                  <SelectItem value={QuestionType.FILL_IN_BLANK}>Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select
                value={createFormData.difficulty}
                onValueChange={(value: string) => setCreateFormData({...createFormData, difficulty: value as DifficultyLevel})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DifficultyLevel.EASY}>Easy</SelectItem>
                  <SelectItem value={DifficultyLevel.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={DifficultyLevel.HARD}>Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="points" className="text-right">
                Points
              </Label>
              <Input
                id="points"
                type="number"
                step="0.5"
                min="0.5"
                value={createFormData.points}
                onChange={(e) => setCreateFormData({...createFormData, points: parseFloat(e.target.value) || 1.0})}
                className="col-span-3"
              />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {createFormData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...createFormData.options]
                      newOptions[index] = e.target.value
                      setCreateFormData({...createFormData, options: newOptions})
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                  {createFormData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newOptions = createFormData.options.filter((_, i) => i !== index)
                        setCreateFormData({...createFormData, options: newOptions})
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {(createFormData.type === QuestionType.MULTIPLE_CHOICE || createFormData.type === QuestionType.FILL_IN_BLANK) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreateFormData({
                      ...createFormData,
                      options: [...createFormData.options, ""]
                    })
                  }}
                >
                  Add Option
                </Button>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="correctAnswer" className="text-right">
                Correct Answer
              </Label>
              <Select
                value={createFormData.correctAnswer}
                onValueChange={(value) => setCreateFormData({...createFormData, correctAnswer: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select correct answer" />
                </SelectTrigger>
                <SelectContent>
                  {createFormData.options.filter(opt => opt.trim() !== "").map((option, index) => (
                    <SelectItem key={index} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="explanation" className="text-right">
                Explanation
              </Label>
              <Textarea
                id="explanation"
                value={createFormData.explanation}
                onChange={(e) => setCreateFormData({...createFormData, explanation: e.target.value})}
                className="col-span-3"
                placeholder="Enter explanation (optional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestion}>
              Create and Add to Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}