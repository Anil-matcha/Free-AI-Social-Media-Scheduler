from setuptools import setup

setup(
    name="gemini-omni-api",
    version="0.1.0",
    author="Anil Matcha",
    description="Python wrapper for the Gemini Omni API on muapi.ai — text-to-video, image-to-video, and video-edit.",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    py_modules=["gemini_omni_api", "mcp_server"],
    install_requires=["requests", "python-dotenv", "mcp[cli]"],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
)
