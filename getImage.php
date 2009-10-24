<?php

/**
* gets a file via HTTP and returns the response.
* in your face, same origin policy!
*/

/**
* 1048576 == 1MB
*/
function file_get_contents2($url, $header = array(), $maxlength = 1048576) {

	$urlbits = parse_url($url);
	$readlength = 0;
	$result = '';
	$fp = fsockopen($urlbits['host'], 80, $errno, $errstr, 10);
	if (!$fp) {
		echo "$errstr ($errno)<br />\n";
		$failcount++;
		//logmessage("FAIL... ", 2, false);
		return false;
	} else {
		$out = "GET " . $urlbits['path'] . '?' . $urlbits['query'] . " HTTP/1.1\r\n";
		$out .= "Host: ".$urlbits['host']."\r\n";

		foreach($header as $headerkey => $headerval) {
			$out .= $headerkey . ": " . $headerval . "\r\n";
		}
		$out .= "Connection: Close\r\n\r\n";

		fwrite($fp, $out);
		while (!feof($fp) && ($readlength < $maxlength)) {
			$result .= fgets($fp, 128);
			$readlength += 128;
		}
		if ($readlength > $maxlength) {
			throw new Exception('zu groß');
		}
		//logmessage((getmicrotime()-$start_request)."\n", 2, false);
		fclose($fp);

	}
	return $result;
}


if (!isset($_GET['url'])) {
	exit();
}

if (substr($_GET['url'], 0, 7) !== 'http://') {
	exit('nope.');
}

$url = $_GET['url'];

try {
	$file = file_get_contents2($url);
} catch(Exception $e) {
	exit('error!');
}

$start = strpos($file, "\r\n\r\n");
$header = substr($file, 0, $start);
$header = explode("\r\n", $header);

header('Content-type: text/plain');

foreach ($header as $headerfield) {
	header($headerfield);
}

echo substr($file, $start + 4);