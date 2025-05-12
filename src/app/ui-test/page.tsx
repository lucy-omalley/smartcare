import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function UiTestPage() {
  return (
    <div className="container mx-auto py-10 space-y-8">
      <h1 className="text-3xl font-bold">Shadcn UI 组件测试</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">按钮组件</h2>
        <div className="flex gap-4">
          <Button variant="default">默认按钮</Button>
          <Button variant="destructive">危险按钮</Button>
          <Button variant="outline">轮廓按钮</Button>
          <Button variant="secondary">次要按钮</Button>
          <Button variant="ghost">幽灵按钮</Button>
          <Button variant="link">链接按钮</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">输入框组件</h2>
        <div className="max-w-sm">
          <Input type="email" placeholder="输入你的邮箱" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">卡片组件</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>账户信息</CardTitle>
            <CardDescription>更新你的账户信息和邮箱地址。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input type="text" placeholder="姓名" />
              <Input type="email" placeholder="邮箱" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">取消</Button>
            <Button>保存</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 