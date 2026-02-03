// CRM Launcher - compiles to CRM-Launcher.exe
// Double-click to start Docker-based CRM and open the app in the browser.
// Requires: Docker Desktop installed and running.
package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

func main() {
	// Directory where the exe lives (project root with docker-compose.yml)
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)

	// Default ports if not set
	if os.Getenv("CRM2_BACKEND_PORT") == "" {
		os.Setenv("CRM2_BACKEND_PORT", "3002")
	}
	if os.Getenv("CRM2_FRONTEND_PORT") == "" {
		os.Setenv("CRM2_FRONTEND_PORT", "5173")
	}
	if os.Getenv("CRM2_POSTGRES_PORT") == "" {
		os.Setenv("CRM2_POSTGRES_PORT", "5434")
	}
	if os.Getenv("CRM2_OLLAMA_PORT") == "" {
		os.Setenv("CRM2_OLLAMA_PORT", "11435")
	}

	fmt.Println("CRM Launcher - starting services...")
	fmt.Println("Project dir:", dir)

	// Prefer "docker compose" (v2), fallback to "docker-compose" (legacy)
	cmd := exec.Command("docker", "compose", "up", "-d", "--build")
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		cmd = exec.Command("docker-compose", "up", "-d", "--build")
		cmd.Dir = dir
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Println("Failed to start containers. Is Docker Desktop running?")
			os.Exit(1)
		}
	}

	port := os.Getenv("CRM2_FRONTEND_PORT")
	if port == "" {
		port = "5173"
	}
	url := "http://localhost:" + port

	fmt.Println("Waiting for app to be ready...")
	time.Sleep(15 * time.Second)

	// Open browser
	switch runtime.GOOS {
	case "windows":
		exec.Command("cmd", "/c", "start", "", url).Start()
	case "darwin":
		exec.Command("open", url).Start()
	default:
		exec.Command("xdg-open", url).Start()
	}

	fmt.Println("CRM is running at", url)
	fmt.Println("To stop: run Stop-CRM.bat or: docker compose down")
}
