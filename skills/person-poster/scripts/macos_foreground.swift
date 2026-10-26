// Optional macOS 14+ adapter. Outputs masks, never redraws or recolors the image.
// Usage: swift macos_foreground.swift ORIGINAL_IMAGE EMPTY_OR_NEW_OUTPUT_DIRECTORY
import Foundation
import Vision
import CoreImage
import ImageIO

func run() throws {
    // Some launchers forward frontend flags before `--`; only the two script
    // arguments after that separator are inputs. Normal `swift script ...`
    // and compiled-binary invocation keep their existing behavior.
    let arguments = Array(CommandLine.arguments.dropFirst())
    let inputs: [String]
    if let separator = arguments.firstIndex(of: "--") {
        inputs = Array(arguments.dropFirst(separator + 1))
    } else {
        inputs = arguments
    }
    guard inputs.count == 2 else {
        throw NSError(domain: "Foreground", code: 1, userInfo: [NSLocalizedDescriptionKey: "Usage: swift macos_foreground.swift IMAGE NEW_DIRECTORY"])
    }
    guard #available(macOS 14.0, *) else {
        throw NSError(domain: "Foreground", code: 1, userInfo: [NSLocalizedDescriptionKey: "This optional adapter requires macOS 14+"])
    }
    let input = URL(fileURLWithPath: inputs[0])
    let output = URL(fileURLWithPath: inputs[1], isDirectory: true)
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: output.path, isDirectory: &isDirectory) {
        guard isDirectory.boolValue, try FileManager.default.contentsOfDirectory(atPath: output.path).isEmpty else {
            throw NSError(domain: "Foreground", code: 1, userInfo: [NSLocalizedDescriptionKey: "Output directory is not empty; choose another directory. Existing files are preserved."])
        }
    }
    guard let source = CGImageSourceCreateWithURL(input as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "Foreground", code: 1, userInfo: [NSLocalizedDescriptionKey: "Input image is unreadable"])
    }
    let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
    if let orientation = properties?[kCGImagePropertyOrientation] as? Int, orientation != 1 {
        throw NSError(domain: "Foreground", code: 1, userInfo: [NSLocalizedDescriptionKey: "Normalize input EXIF orientation first"])
    }
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()
    try handler.perform([request])
    guard let observation = request.results?.first, !observation.allInstances.isEmpty else {
        throw NSError(domain: "Foreground", code: 1, userInfo: [NSLocalizedDescriptionKey: "No foreground instance detected"])
    }
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    let context = CIContext()
    var entries: [[String: Any]] = []
    for id in observation.allInstances {
        let buffer = try observation.generateScaledMaskForImage(forInstances: IndexSet(integer: id), from: handler)
        let file = "mask-\(id).png"
        try context.writePNGRepresentation(of: CIImage(cvPixelBuffer: buffer), to: output.appendingPathComponent(file), format: .L8, colorSpace: CGColorSpaceCreateDeviceGray(), options: [:])
        entries.append(["instance": id, "file": file, "size": [image.width, image.height]])
    }
    let record: [String: Any] = ["engine": "Apple Vision VNGenerateForegroundInstanceMaskRequest", "input": input.path, "instances": entries, "visualAcceptance": "pending: choose actual subject and inspect edges/props"]
    let data = try JSONSerialization.data(withJSONObject: record, options: [.prettyPrinted, .sortedKeys])
    try data.write(to: output.appendingPathComponent("segmentation.json"))
    print(String(data: data, encoding: .utf8)!)
}
do { try run() } catch {
    fputs("\(error.localizedDescription)\n", stderr)
    exit(1)
}
