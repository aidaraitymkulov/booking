import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const App = () => (
  <main className="mx-auto max-w-2xl p-6">
    <Card>
      <CardHeader>
        <CardTitle>Room booking</CardTitle>
        <CardDescription>Design system preview placeholder</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
        <Badge>09:00–10:30</Badge>
      </CardContent>
    </Card>
  </main>
)
