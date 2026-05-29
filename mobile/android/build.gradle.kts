allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

// --- ĐOẠN CODE FIX LỖI NAMESPACE CHO THƯ VIỆN BÊN NGOÀI ---
subprojects {
    // Chỉ áp dụng cho các package/thư viện, bỏ qua thư mục ":app" vì nó đã được evaluate
    if (project.name != "app") {
        afterEvaluate {
            if (hasProperty("android")) {
                configure<com.android.build.gradle.BaseExtension> {
                    if (namespace == null) {
                        namespace = project.group.toString()
                    }
                }
            }
        }
    }
}